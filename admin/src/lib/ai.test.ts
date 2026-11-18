import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  role: 'admin',
  getAI: vi.fn(),
  getGenerativeModel: vi.fn(),
  generateContent: vi.fn(),
  backend: vi.fn(),
}));

vi.mock('./firebase.js', () => ({ app: { name: 'fake-app' } }));
vi.mock('./auth-core.js', () => ({ currentRole: () => h.role }));
vi.mock('firebase/ai', () => ({
  getAI: (...a: unknown[]) => h.getAI(...a),
  getGenerativeModel: (...a: unknown[]) => h.getGenerativeModel(...a),
  GoogleAIBackend: class {
    kind = 'google';
    constructor() {
      h.backend();
    }
  },
  Schema: {
    string: () => ({ t: 'string' }),
    integer: () => ({ t: 'integer' }),
    array: (p: { items: unknown }) => ({ t: 'array', items: p.items }),
    object: (p: { properties: Record<string, unknown> }) => ({ t: 'object', properties: p.properties }),
  },
}));

const criteria = [
  { id: 'interest', label: 'Interest', weight: 1, invert: false },
  { id: 'impact', label: 'Impact', weight: 2, invert: false },
  { id: 'effort', label: 'Effort', weight: 1, invert: true },
];
const idea = { title: 'T', brief: 'B', content: 'C' };
const reply = (text: string) => ({ response: { text: () => text } });

let ai: typeof import('./ai.js');
beforeEach(async () => {
  vi.resetModules();
  h.role = 'admin';
  h.getAI.mockReset().mockReturnValue({ fake: 'ai' });
  h.backend.mockReset();
  h.generateContent.mockReset();
  h.getGenerativeModel.mockReset().mockReturnValue({ generateContent: h.generateContent });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  ai = await import('./ai.js');
});

describe('shapes', () => {
  it('parseIdea returns {title, content, tags, brief}', async () => {
    h.generateContent.mockResolvedValue(
      reply(JSON.stringify({ title: 'Cool', content: '## Overview\nx', tags: ['AI', 'nope', 'web'], brief: 'Short.' })),
    );
    expect(await ai.parseIdea('raw')).toEqual({ title: 'Cool', content: '## Overview\nx', tags: ['AI', 'web'], brief: 'Short.' });
    const cfg = h.getGenerativeModel.mock.calls[0][1];
    expect(cfg.model).toBe(ai.GEMINI_MODEL);
    expect(cfg.generationConfig.responseMimeType).toBe('application/json');
    expect(cfg.generationConfig.responseSchema.properties.title).toEqual({ t: 'string' });
    expect(h.generateContent.mock.calls[0][0]).toContain('raw');
  });

  it('enhanceIdea returns {content} unfenced, plain text mode', async () => {
    h.generateContent.mockResolvedValue(reply('```markdown\n# Merged\n```'));
    expect(await ai.enhanceIdea('old', 'new')).toEqual({ content: '# Merged' });
    const cfg = h.getGenerativeModel.mock.calls[0][1];
    expect(cfg.generationConfig?.responseMimeType).toBeUndefined();
    expect(h.generateContent.mock.calls[0][0]).toContain('old');
    expect(h.generateContent.mock.calls[0][0]).toContain('new');
  });

  it('rankIdea returns {scores, analysis}; schema excludes interest', async () => {
    h.generateContent.mockResolvedValue(reply(JSON.stringify({ scores: { impact: '4.7', effort: 9 }, analysis: 'ok' })));
    expect(await ai.rankIdea(idea, criteria)).toEqual({ scores: { impact: 4, effort: 5 }, analysis: 'ok' });
    const schema = h.getGenerativeModel.mock.calls[0][1].generationConfig.responseSchema;
    expect(Object.keys(schema.properties.scores.properties)).toEqual(['impact', 'effort']);
    expect(schema.properties.scores.properties).not.toHaveProperty('interest');
    expect(h.generateContent.mock.calls[0][0]).not.toContain('id="interest"');
  });
});

describe('getAI setup', () => {
  it('memoizes getAI with GoogleAIBackend and limited-use tokens', async () => {
    h.generateContent.mockResolvedValue(reply('# x'));
    await ai.enhanceIdea('a', 'b');
    vi.advanceTimersByTime(ai.AI_COOLDOWN_MS);
    await ai.enhanceIdea('a', 'b');
    expect(h.getAI).toHaveBeenCalledTimes(1);
    const [app, opts] = h.getAI.mock.calls[0];
    expect(app).toEqual({ name: 'fake-app' });
    expect(opts.useLimitedUseAppCheckTokens).toBe(true);
    expect(opts.backend.kind).toBe('google');
  });

  it('GEMINI_MODEL is gemini-3.5-flash-lite', () => {
    expect(ai.GEMINI_MODEL).toBe('gemini-3.5-flash-lite');
  });
});

describe('admin guard', () => {
  it.each(['guest', 'anything'])('role %s throws Admin only for all three, no SDK call', async (r) => {
    h.role = r;
    await expect(ai.parseIdea('x')).rejects.toThrow('Admin only');
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow('Admin only');
    await expect(ai.rankIdea(idea, criteria)).rejects.toThrow('Admin only');
    expect(h.getAI).not.toHaveBeenCalled();
    expect(h.generateContent).not.toHaveBeenCalled();
  });
});

describe('malformed output', () => {
  it('retries once and succeeds', async () => {
    h.generateContent.mockResolvedValueOnce(reply('not json')).mockResolvedValueOnce(
      reply(JSON.stringify({ title: 'A', content: 'B', tags: [], brief: '' })),
    );
    expect((await ai.parseIdea('x')).title).toBe('A');
    expect(h.generateContent).toHaveBeenCalledTimes(2);
  });

  it('retries once then throws the mapped message', async () => {
    h.generateContent.mockResolvedValue(reply('not json'));
    await expect(ai.parseIdea('x')).rejects.toThrow('AI returned malformed output, try again');
    expect(h.generateContent).toHaveBeenCalledTimes(2);
  });

  it('does not retry SDK errors; maps them', async () => {
    h.generateContent.mockRejectedValue(Object.assign(new Error('x'), { customErrorData: { status: 429 } }));
    await expect(ai.rankIdea(idea, criteria)).rejects.toThrow('Gemini quota reached, try again later');
    expect(h.generateContent).toHaveBeenCalledTimes(1);
  });
});

describe('cooldown', () => {
  const ok = () => h.generateContent.mockResolvedValue(reply('# x'));

  it('AI_COOLDOWN_MS is 12s', () => {
    expect(ai.AI_COOLDOWN_MS).toBe(12_000);
  });

  it('blocks a second call within the interval with a friendly message, no SDK call', async () => {
    ok();
    await ai.enhanceIdea('a', 'b');
    vi.advanceTimersByTime(2_500);
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow('Please wait 10 seconds before the next AI request.');
    expect(h.generateContent).toHaveBeenCalledTimes(1);
  });

  it('rounds seconds up', async () => {
    ok();
    await ai.enhanceIdea('a', 'b');
    vi.advanceTimersByTime(11_001);
    await expect(ai.parseIdea('x')).rejects.toThrow('Please wait 1 second before the next AI request.');
  });

  it('allows a call once the interval has passed', async () => {
    ok();
    await ai.enhanceIdea('a', 'b');
    vi.advanceTimersByTime(12_000);
    await expect(ai.enhanceIdea('a', 'b')).resolves.toEqual({ content: '# x' });
    expect(h.generateContent).toHaveBeenCalledTimes(2);
  });

  it('blocks a concurrent call while one is in flight', async () => {
    let release!: (v: unknown) => void;
    h.generateContent.mockReturnValue(new Promise((r) => (release = r)));
    const first = ai.enhanceIdea('a', 'b');
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow(/wait/i);
    release(reply('# x'));
    await first;
    expect(h.generateContent).toHaveBeenCalledTimes(1);
  });

  it('a failed call still counts toward the interval', async () => {
    h.generateContent.mockRejectedValue(new Error('boom'));
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow('AI request failed');
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow('Please wait 12 seconds');
  });

  it('the malformed-output retry is not blocked by the cooldown', async () => {
    h.generateContent.mockResolvedValueOnce(reply('not json')).mockResolvedValueOnce(
      reply(JSON.stringify({ title: 'A', content: 'B', tags: [], brief: '' })),
    );
    expect((await ai.parseIdea('x')).title).toBe('A');
    expect(h.generateContent).toHaveBeenCalledTimes(2);
  });

  it('guest rejection does not consume the cooldown', async () => {
    ok();
    h.role = 'guest';
    await expect(ai.enhanceIdea('a', 'b')).rejects.toThrow('Admin only');
    h.role = 'admin';
    await expect(ai.enhanceIdea('a', 'b')).resolves.toBeDefined();
  });
});
