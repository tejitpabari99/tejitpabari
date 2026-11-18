import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  listIdeas: vi.fn(),
  getIdea: vi.fn(),
  setRanking: vi.fn(),
  getCriteria: vi.fn(),
  rankIdea: vi.fn(),
}));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../lib/ideas.js', async (orig) => ({
  ...(await orig<typeof import('../lib/ideas.js')>()),
  listIdeas: h.listIdeas,
  getIdea: h.getIdea,
  setRanking: h.setRanking,
}));
vi.mock('../lib/settings.js', () => ({ getCriteria: h.getCriteria }));
vi.mock('../lib/ai.js', () => ({ rankIdea: h.rankIdea }));

import { renderPage } from '../test-utils';
import Rank from './Rank';

const CRITERIA = [
  { id: 'a', label: 'A', weight: 1, invert: false },
  { id: 'b', label: 'B', weight: 1, invert: true },
];
const idea = (slug: string, title: string, o: Record<string, unknown> = {}) => ({
  slug, title, status: 'new', tags: [], link: '', github: '', brief: `brief ${slug}`, ranked: false, scores: {}, date: '', excerpt: '', ...o,
});

beforeEach(() => {
  Object.values(h).forEach((f) => f.mockReset());
  h.listIdeas.mockResolvedValue([
    idea('z', 'Zed'),
    idea('r', 'Ranked', { ranked: true }),
    idea('d', 'Done', { status: 'completed' }),
    idea('a', 'Alpha'),
  ]);
  h.getCriteria.mockResolvedValue(CRITERIA);
  h.getIdea.mockImplementation(async (slug: string) => ({ ...idea(slug, slug), content: `body ${slug}` }));
  h.setRanking.mockResolvedValue(undefined);
});

describe('Rank', () => {
  it('queues only unranked new ideas, sorted by title, first shown', async () => {
    renderPage(<Rank />, 'admin');
    expect(await screen.findByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByText('0 of 2 ranked')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('save and next saves sliders via setRanking and advances; finishes', async () => {
    renderPage(<Rank />, 'admin');
    await screen.findByRole('heading', { name: 'Alpha' });
    fireEvent.change(screen.getByRole('slider', { name: 'A' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & Next' }));
    await waitFor(() => expect(h.setRanking).toHaveBeenCalledWith('a', { scores: { a: 4 }, analysis: '' }));
    expect(await screen.findByRole('heading', { name: 'Zed' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText(/All done/)).toBeInTheDocument();
  });

  it('auto-rank calls rankIdea with full content, saves, advances', async () => {
    h.rankIdea.mockResolvedValue({ scores: { a: 3, b: 2 }, analysis: 'why' });
    renderPage(<Rank />, 'admin');
    await screen.findByRole('heading', { name: 'Alpha' });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank' }));
    await waitFor(() => expect(h.setRanking).toHaveBeenCalledWith('a', { scores: { a: 3, b: 2 }, analysis: 'why' }));
    expect(h.rankIdea).toHaveBeenCalledWith({ title: 'a', brief: 'brief a', content: 'body a' }, CRITERIA);
    expect(await screen.findByRole('heading', { name: 'Zed' })).toBeInTheDocument();
  });

  it('surfaces the AI stub error and stays on the idea', async () => {
    h.rankIdea.mockRejectedValue(new Error('AI is not configured yet'));
    renderPage(<Rank />, 'admin');
    await screen.findByRole('heading', { name: 'Alpha' });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI is not configured yet');
    expect(h.setRanking).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('shows empty state when nothing to rank', async () => {
    h.listIdeas.mockResolvedValue([idea('r', 'Ranked', { ranked: true })]);
    renderPage(<Rank />, 'admin');
    expect(await screen.findByText('No unranked ideas to review.')).toBeInTheDocument();
  });
});
