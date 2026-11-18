import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  getIdea: vi.fn(),
  saveIdeaMeta: vi.fn(),
  saveIdeaContent: vi.fn(),
  deleteIdea: vi.fn(),
  setRanking: vi.fn(),
  resetRanking: vi.fn(),
  getCriteria: vi.fn(),
  enhanceIdea: vi.fn(),
  rankIdea: vi.fn(),
}));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../lib/ideas.js', async (orig) => ({
  ...(await orig<typeof import('../lib/ideas.js')>()),
  getIdea: h.getIdea,
  saveIdeaMeta: h.saveIdeaMeta,
  saveIdeaContent: h.saveIdeaContent,
  deleteIdea: h.deleteIdea,
  setRanking: h.setRanking,
  resetRanking: h.resetRanking,
}));
vi.mock('../lib/settings.js', () => ({ getCriteria: h.getCriteria }));
vi.mock('../lib/ai.js', () => ({ enhanceIdea: h.enhanceIdea, rankIdea: h.rankIdea }));

import { renderMarkdown } from '../lib/ideas.js';
import { renderPage } from '../test-utils';
import IdeaDetail from './IdeaDetail';

const CRITERIA = [
  { id: 'a', label: 'A', weight: 1, invert: false },
  { id: 'b', label: 'B', weight: 1, invert: true },
];
const BODY = '# Heading\n\nSome **bold** text and a [link](https://x.test).\n\n- one\n- two';
const IDEA = {
  slug: 'foo', title: 'Foo', status: 'new', tags: ['Dev'], link: '', github: '', brief: 'br',
  ranked: false, scores: {}, date: '2026-01-01', content: BODY, html: renderMarkdown(BODY),
};

function page(role: 'admin' | 'guest', path = '/ideas/foo') {
  return renderPage(
    <Routes>
      <Route path="/ideas/:slug" element={<IdeaDetail />} />
      <Route path="/ideas" element={<p>ideas list</p>} />
    </Routes>,
    role,
    path,
  );
}

beforeEach(() => {
  Object.values(h).forEach((f) => f.mockReset());
  h.getIdea.mockResolvedValue(IDEA);
  h.getCriteria.mockResolvedValue(CRITERIA);
  for (const f of [h.saveIdeaMeta, h.saveIdeaContent, h.deleteIdea, h.setRanking, h.resetRanking]) f.mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('IdeaDetail', () => {
  it('renders body HTML identical to renderMarkdown output', async () => {
    page('guest');
    await screen.findByRole('heading', { name: 'Foo' });
    expect(screen.getByTestId('markdown').innerHTML).toBe(renderMarkdown(BODY));
  });

  it('renders a not-found view when the idea is missing', async () => {
    h.getIdea.mockResolvedValue(null);
    page('admin', '/ideas/nope');
    expect(await screen.findByText(/Idea not found/)).toBeInTheDocument();
    expect(h.getCriteria).not.toHaveBeenCalledWith('nope');
  });

  it('guest has no write controls', async () => {
    page('guest');
    await screen.findByRole('heading', { name: 'Foo' });
    for (const re of [/Add More Info/, /^Delete/, /Edit tags/, /Add link/, /Add GitHub/, /Auto-rank/, /Save ranking/, /Edit title/]) {
      expect(screen.queryByRole('button', { name: re })).toBeNull();
    }
    expect(screen.queryByRole('combobox')).toBeNull();
    screen.getAllByRole('slider').forEach((s) => expect(s).toBeDisabled());
  });

  it('status change calls saveIdeaMeta({status})', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'completed' } });
    await waitFor(() => expect(h.saveIdeaMeta).toHaveBeenCalledWith('foo', { status: 'completed' }));
  });

  it('tags edit parses comma list', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit tags' }));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. AI/), { target: { value: ' ai, mobile ,,' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveIdeaMeta).toHaveBeenCalledWith('foo', { tags: ['ai', 'mobile'] }));
  });

  it('title edit trims; empty title is not saved', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    const box = screen.getByDisplayValue('Foo');
    fireEvent.change(box, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(h.saveIdeaMeta).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: '  New Title ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveIdeaMeta).toHaveBeenCalledWith('foo', { title: 'New Title' }));
  });

  it('link and github edits call saveIdeaMeta', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: '+ Add link' }));
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: ' https://a.test ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveIdeaMeta).toHaveBeenCalledWith('foo', { link: 'https://a.test' }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add GitHub' }));
    fireEvent.change(screen.getByPlaceholderText('https://github.com/...'), { target: { value: 'https://github.com/x/y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveIdeaMeta).toHaveBeenCalledWith('foo', { github: 'https://github.com/x/y' }));
  });

  it('delete confirms, deletes, navigates to /ideas', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(h.deleteIdea).toHaveBeenCalledWith('foo'));
    expect(await screen.findByText('ideas list')).toBeInTheDocument();
  });

  it('enhance previews rendered markdown then saveIdeaContent', async () => {
    h.enhanceIdea.mockResolvedValue({ content: '## Merged' });
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: '+ Add More Info' }));
    fireEvent.change(screen.getByPlaceholderText(/additional notes/), { target: { value: 'more' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enhance with AI' }));
    expect(h.enhanceIdea).toHaveBeenCalledWith(BODY, 'more');
    await screen.findByText('Review the merged content before saving.');
    expect(screen.getAllByTestId('markdown').some((m) => m.innerHTML === renderMarkdown('## Merged'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(h.saveIdeaContent).toHaveBeenCalledWith('foo', '## Merged'));
  });

  it('enhance surfaces the AI stub error', async () => {
    h.enhanceIdea.mockRejectedValue(new Error('AI is not configured yet'));
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: '+ Add More Info' }));
    fireEvent.change(screen.getByPlaceholderText(/additional notes/), { target: { value: 'more' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enhance with AI' }));
    expect(await screen.findByText('AI is not configured yet')).toBeInTheDocument();
    expect(h.saveIdeaContent).not.toHaveBeenCalled();
  });

  it('save ranking, auto-rank and reset use setRanking / resetRanking', async () => {
    h.rankIdea.mockResolvedValue({ scores: { a: 4 }, analysis: 'because' });
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    const [sa] = screen.getAllByRole('slider');
    fireEvent.change(sa, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save ranking' }));
    await waitFor(() => expect(h.setRanking).toHaveBeenCalledWith('foo', { scores: { a: 3 }, analysis: '' }));
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank' }));
    await waitFor(() =>
      expect(h.rankIdea).toHaveBeenCalledWith({ title: 'Foo', brief: 'br', content: BODY }, CRITERIA),
    );
    await waitFor(() => expect(h.setRanking).toHaveBeenCalledWith('foo', { scores: { a: 4 }, analysis: 'because' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(h.resetRanking).toHaveBeenCalledWith('foo'));
  });

  it('reloads the idea after ranking writes so Add More Info uses fresh content', async () => {
    h.rankIdea.mockResolvedValue({ scores: { a: 4 }, analysis: 'because' });
    h.enhanceIdea.mockResolvedValue({ content: '## Merged' });
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    expect(h.getIdea).toHaveBeenCalledTimes(1);
    const FRESH = BODY + '\n\n## Ranking Analysis\n\nbecause';
    h.getIdea.mockResolvedValue({ ...IDEA, content: FRESH, html: renderMarkdown(FRESH) });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank' }));
    await waitFor(() => expect(h.setRanking).toHaveBeenCalled());
    await waitFor(() => expect(h.getIdea).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('markdown').innerHTML).toBe(renderMarkdown(FRESH)));
    fireEvent.click(screen.getByRole('button', { name: '+ Add More Info' }));
    fireEvent.change(screen.getByPlaceholderText(/additional notes/), { target: { value: 'more' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enhance with AI' }));
    expect(h.enhanceIdea).toHaveBeenCalledWith(FRESH, 'more');
  });

  it('reloads after save ranking and reset', async () => {
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: 'Save ranking' }));
    await waitFor(() => expect(h.getIdea).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(h.getIdea).toHaveBeenCalledTimes(3));
  });

  it('auto-rank surfaces the AI stub error', async () => {
    h.rankIdea.mockRejectedValue(new Error('AI is not configured yet'));
    page('admin');
    await screen.findByRole('heading', { name: 'Foo' });
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rank' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI is not configured yet');
    expect(h.setRanking).not.toHaveBeenCalled();
  });
});
