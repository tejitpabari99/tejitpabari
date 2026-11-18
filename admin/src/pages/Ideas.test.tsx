import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  listIdeas: vi.fn(),
  getIdea: vi.fn(),
  createIdea: vi.fn(),
  setRanking: vi.fn(),
  resetAllRankings: vi.fn(),
  getCriteria: vi.fn(),
  parseIdea: vi.fn(),
  rankIdea: vi.fn(),
  cooldownRemainingMs: vi.fn(),
}));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../lib/ideas.js', async (orig) => ({
  ...(await orig<typeof import('../lib/ideas.js')>()),
  listIdeas: h.listIdeas,
  getIdea: h.getIdea,
  createIdea: h.createIdea,
  setRanking: h.setRanking,
  resetAllRankings: h.resetAllRankings,
}));
vi.mock('../lib/settings.js', () => ({ getCriteria: h.getCriteria }));
vi.mock('../lib/ai.js', () => ({ parseIdea: h.parseIdea, rankIdea: h.rankIdea, cooldownRemainingMs: h.cooldownRemainingMs }));

import { renderPage } from '../test-utils';
import Ideas from './Ideas';

const CRITERIA = [
  { id: 'a', label: 'A', weight: 1, invert: false },
  { id: 'b', label: 'B', weight: 1, invert: true },
];
const idea = (slug: string, o: Record<string, unknown> = {}) => ({
  slug, title: slug.toUpperCase(), status: 'new', tags: [], link: '', github: '', brief: '', ranked: false,
  scores: {}, date: '2026-01-01', excerpt: `about ${slug}`, ...o,
});
const FIXTURE = [
  idea('old', { date: '2026-01-01', status: 'completed', ranked: true, scores: { a: 5, b: 1 } }), // 100
  idea('mid', { date: '2026-03-01', status: 'new', ranked: true, scores: { a: 1, b: 5 }, tags: ['Dev'] }), // 20
  idea('new', { date: '2026-05-01', status: 'inprogress' }),
  idea('nodate', { date: '' }),
];

beforeEach(() => {
  Object.values(h).forEach((f) => f.mockReset());
  h.listIdeas.mockResolvedValue(FIXTURE);
  h.getCriteria.mockResolvedValue(CRITERIA);
  h.getIdea.mockImplementation(async (slug: string) => ({ ...idea(slug), content: `body ${slug}`, brief: `brief ${slug}` }));
  h.setRanking.mockResolvedValue(undefined);
  h.resetAllRankings.mockResolvedValue(undefined);
  h.cooldownRemainingMs.mockReturnValue(0);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

const order = () => screen.getAllByTestId(/^row-/).map((r) => r.getAttribute('data-testid')!.slice(4));

describe('Ideas list', () => {
  it('shows excerpt, computed score and default date-desc order (undated last)', async () => {
    renderPage(<Ideas />, 'guest');
    await screen.findByTestId('row-old');
    expect(order()).toEqual(['new', 'mid', 'old', 'nodate']);
    expect(within(screen.getByTestId('row-old')).getByText('100')).toBeInTheDocument();
    expect(within(screen.getByTestId('row-mid')).getByText('20')).toBeInTheDocument();
    expect(within(screen.getByTestId('row-mid')).getByText('Dev')).toBeInTheDocument();
  });

  it('sorts by rank (ranked first, score desc then asc) and by status', async () => {
    renderPage(<Ideas />, 'guest');
    await screen.findByTestId('row-old');
    fireEvent.click(screen.getByText(/^Rank/, { selector: 'th' })); // asc first click
    expect(order().slice(0, 2)).toEqual(['mid', 'old']);
    fireEvent.click(screen.getByText(/^Rank/, { selector: 'th' }));
    expect(order().slice(0, 2)).toEqual(['old', 'mid']);
    fireEvent.click(screen.getByText(/^Status/, { selector: 'th' })); // new, inprogress, completed
    expect(order()).toEqual(['mid', 'nodate', 'new', 'old']);
  });

  it('filters by status and search', async () => {
    renderPage(<Ideas />, 'guest');
    await screen.findByTestId('row-old');
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(order()).toEqual(['old']);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(screen.getByPlaceholderText('Search ideas...'), { target: { value: 'about mid' } });
    expect(order()).toEqual(['mid']);
  });

  it('guest is read-only: no Add / Auto-rank / Reset / rank-it', async () => {
    renderPage(<Ideas />, 'guest');
    await screen.findByTestId('row-old');
    expect(screen.queryByRole('button', { name: /Add Idea/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Auto-rank/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reset all/ })).toBeNull();
    expect(screen.queryByText(/rank it/)).toBeNull();
  });

  it('surfaces loader errors', async () => {
    h.listIdeas.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    renderPage(<Ideas />, 'guest');
    expect(await screen.findByRole('alert')).toHaveTextContent('Missing or insufficient permissions.');
  });
});

describe('Add Idea', () => {
  async function openAdd() {
    renderPage(<Ideas />, 'admin');
    await screen.findByTestId('row-old');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Idea' }));
    fireEvent.change(screen.getByPlaceholderText(/Paste your raw idea notes/), { target: { value: 'raw notes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Parse with AI' }));
  }

  it('shows the AI stub error "AI is not configured yet" and stays on input', async () => {
    h.parseIdea.mockRejectedValue(new Error('AI is not configured yet'));
    await openAdd();
    expect(await screen.findByRole('alert')).toHaveTextContent('AI is not configured yet');
    expect(h.createIdea).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/Paste your raw idea notes/)).toBeInTheDocument();
  });

  it('parseIdea -> preview with slug -> createIdea -> navigates', async () => {
    h.parseIdea.mockResolvedValue({ title: 'My Great Idea!', content: '# md', tags: ['dev'], brief: 'b' });
    h.createIdea.mockResolvedValue('my-great-idea-2');
    await openAdd();
    expect(h.parseIdea).toHaveBeenCalledWith('raw notes');
    expect(await screen.findByText('My Great Idea!')).toBeInTheDocument();
    expect(screen.getByText('/ideas/my-great-idea')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Idea' }));
    await waitFor(() =>
      expect(h.createIdea).toHaveBeenCalledWith({ title: 'My Great Idea!', content: '# md', tags: ['dev'], brief: 'b' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('surfaces createIdea errors on the preview', async () => {
    h.parseIdea.mockResolvedValue({ title: 'X', content: 'c', tags: [], brief: '' });
    h.createIdea.mockRejectedValue(new Error('Slug "rank" is reserved'));
    await openAdd();
    fireEvent.click(await screen.findByRole('button', { name: 'Save Idea' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slug "rank" is reserved');
  });
});

describe('bulk actions', () => {
  it('reset all rankings calls resetAllRankings(ranked slugs) then reloads', async () => {
    renderPage(<Ideas />, 'admin');
    await screen.findByTestId('row-old');
    fireEvent.click(screen.getByRole('button', { name: 'Reset all rankings' }));
    await waitFor(() => expect(h.resetAllRankings).toHaveBeenCalledWith(['old', 'mid']));
    await waitFor(() => expect(h.listIdeas).toHaveBeenCalledTimes(2));
  });

  it('reset does nothing when not confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(<Ideas />, 'admin');
    await screen.findByTestId('row-old');
    fireEvent.click(screen.getByRole('button', { name: 'Reset all rankings' }));
    expect(h.resetAllRankings).not.toHaveBeenCalled();
  });

  it('auto-rank all is sequential and waits out the AI cooldown between calls', async () => {
    const many = Array.from({ length: 3 }, (_, i) => idea(`n${i}`));
    h.listIdeas.mockResolvedValue(many);
    renderPage(<Ideas />, 'admin');
    await screen.findByTestId('row-n0');
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    try {
      let lastStart = -Infinity;
      let inFlight = 0;
      let max = 0;
      h.cooldownRemainingMs.mockImplementation(() => Math.max(0, lastStart + 12_000 - Date.now()));
      h.rankIdea.mockImplementation(async () => {
        if (h.cooldownRemainingMs() > 0) throw new Error('Please wait');
        lastStart = Date.now();
        inFlight++;
        max = Math.max(max, inFlight);
        await Promise.resolve();
        inFlight--;
        return { scores: { a: 3 }, analysis: 'ok' };
      });
      fireEvent.click(screen.getByRole('button', { name: 'Auto-rank all' }));
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(h.setRanking).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/waiting for AI cooldown/)).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(12_000); });
      expect(h.setRanking).toHaveBeenCalledTimes(2);
      await act(async () => { await vi.advanceTimersByTimeAsync(12_000); });
      expect(h.setRanking).toHaveBeenCalledTimes(3);
      expect(max).toBe(1);
      expect(h.rankIdea).toHaveBeenCalledWith({ title: 'N0', brief: 'brief n0', content: 'body n0' }, CRITERIA);
      expect(h.setRanking).toHaveBeenCalledWith('n0', { scores: { a: 3 }, analysis: 'ok' });
      expect(screen.getByText(/3 ranked/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('auto-rank surfaces the AI stub error count/message', async () => {
    h.rankIdea.mockRejectedValue(new Error('AI is not configured yet'));
    renderPage(<Ideas />, 'admin');
    await screen.findByTestId('row-new');
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank all' }));
    expect(await screen.findByText(/AI is not configured yet/)).toBeInTheDocument();
    expect(h.setRanking).not.toHaveBeenCalled();
  });
});
