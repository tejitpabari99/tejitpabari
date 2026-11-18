import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TagPill } from '@site/components/TagPill';
import { useAuth } from '../auth/useAuth';
import { useLoader } from '../hooks/useLoader';
import { cooldownRemainingMs, parseIdea, rankIdea } from '../lib/ai.js';
import { computeScore, createIdea, getIdea, listIdeas, resetAllRankings, setRanking, slugifyTitle } from '../lib/ideas.js';
import { getCriteria } from '../lib/settings.js';
import type { Criterion } from '../types';
import { filterIdeas, sortIdeas, STATUS_LABEL, type IdeaRow, type SortCol, type SortDir } from './ideas-utils';

const input = 'w-full rounded-card border border-teal-secondary/30 bg-white px-3 py-2 text-sm';
const ghost = 'rounded-pill border border-teal-secondary px-3 py-1 text-xs font-semibold text-teal-secondary hover:bg-teal-secondary hover:text-white disabled:opacity-40';

interface Parsed {
  title: string;
  content: string;
  tags: string[];
  brief: string;
}

function AddIdeaModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'input' | 'loading' | 'preview' | 'saving'>('input');
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<Parsed | null>(null);
  const [error, setError] = useState('');

  async function parse() {
    if (!raw.trim()) return;
    setStep('loading');
    setError('');
    try {
      setPreview(await parseIdea(raw));
      setStep('preview');
    } catch (e) {
      setError((e as Error).message || 'Parse failed');
      setStep('input');
    }
  }

  async function save() {
    if (!preview) return;
    setStep('saving');
    setError('');
    try {
      const slug = await createIdea({
        title: preview.title,
        content: preview.content,
        tags: preview.tags,
        brief: preview.brief,
      });
      onClose();
      navigate(`/ideas/${slug}`);
    } catch (e) {
      setError((e as Error).message || 'Save failed');
      setStep('preview');
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label="Add Idea" className="w-full max-w-lg space-y-3 rounded-card bg-cream p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-teal">{step === 'preview' || step === 'saving' ? 'Review Idea' : 'Add Idea'}</h2>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {step === 'input' && (
          <>
            <p className="text-xs text-slate">Paste your raw notes. AI will clean up the English and structure it.</p>
            <textarea className={input} rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste your raw idea notes here..." />
            <div className="flex justify-end gap-2">
              <button type="button" className={ghost} onClick={onClose}>Cancel</button>
              <button type="button" className={ghost} onClick={parse} disabled={!raw.trim()}>Parse with AI</button>
            </div>
          </>
        )}
        {(step === 'loading' || step === 'saving') && <p className="text-sm text-slate">{step === 'loading' ? 'Parsing…' : 'Saving…'}</p>}
        {step === 'preview' && preview && (
          <>
            <p className="text-sm"><span className="text-xs text-slate">Title </span><span className="font-semibold">{preview.title}</span></p>
            <p className="text-xs text-slate">Slug: <span>/ideas/{slugifyTitle(preview.title)}</span></p>
            <div className="flex flex-wrap gap-1">{preview.tags.map((t) => <TagPill key={t}>{t}</TagPill>)}</div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-card bg-white p-3 text-xs">{preview.content}</pre>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghost} onClick={() => setStep('input')}>Edit</button>
              <button type="button" className={ghost} onClick={save}>Save Idea</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface Bulk {
  running: boolean;
  done: number;
  failed: number;
  total: number;
  lastError: string;
  waiting?: boolean;
}

export default function Ideas() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const { data, error, reload } = useLoader<[IdeaRow[], Criterion[]]>(() => Promise.all([listIdeas(), getCriteria()]));
  const ideas = useMemo(() => data?.[0] ?? [], [data]);
  const criteria = useMemo(() => data?.[1] ?? [], [data]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAdd, setShowAdd] = useState(false);
  const [bulk, setBulk] = useState<Bulk | null>(null);
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const allTags = useMemo(() => [...new Set(ideas.flatMap((i) => i.tags))].sort(), [ideas]);
  const rows = useMemo(
    () => sortIdeas(filterIdeas(ideas, { status, tags: tagFilter, search }), sortCol, sortDir, criteria),
    [ideas, status, tagFilter, search, sortCol, sortDir, criteria],
  );

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  }
  const icon = (col: SortCol) => (sortCol !== col ? '⇕' : sortDir === 'asc' ? '↑' : '↓');

  async function autoRankAll() {
    if (!window.confirm('Auto-rank all unranked new ideas?')) return;
    const targets = ideas.filter((i) => !i.ranked && i.status === 'new');
    if (targets.length === 0) return;
    const state: Bulk = { running: true, done: 0, failed: 0, total: targets.length, lastError: '' };
    setBulk({ ...state });
    // Sequential: the AI client allows one call at a time with a minimum gap between starts.
    for (const i of targets) {
      if (!mounted.current) return;
      const wait = cooldownRemainingMs();
      if (wait > 0) {
        setBulk({ ...state, waiting: true });
        await new Promise((r) => setTimeout(r, wait));
        if (!mounted.current) return;
      }
      setBulk({ ...state });
      try {
        const full = await getIdea(i.slug);
        if (!full) throw new Error('Idea not found');
        const result = await rankIdea({ title: full.title, brief: full.brief, content: full.content }, criteria);
        await setRanking(i.slug, { scores: result.scores, analysis: result.analysis });
        state.done++;
      } catch (e) {
        state.failed++;
        state.lastError = (e as Error).message;
      }
      if (mounted.current) setBulk({ ...state });
    }
    if (!mounted.current) return;
    setBulk({ ...state, running: false });
    reload();
  }

  async function resetAll() {
    if (!window.confirm('Reset rankings for ALL ranked ideas? This cannot be undone.')) return;
    setResetting(true);
    setActionError('');
    try {
      await resetAllRankings(ideas.filter((i) => i.ranked).map((i) => i.slug));
      reload();
    } catch (e) {
      setActionError((e as Error).message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  const th = 'cursor-pointer select-none p-3';
  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal">Ideas</h1>
          <p className="text-sm text-slate">{ideas.length} ideas</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col items-end gap-2">
            <button type="button" onClick={() => setShowAdd(true)} className="rounded-pill bg-teal px-4 py-2 text-sm font-semibold text-white">+ Add Idea</button>
            <div className="flex gap-2">
              <button type="button" className={ghost} onClick={autoRankAll} disabled={!!bulk?.running}>Auto-rank all</button>
              <button type="button" className={ghost} onClick={resetAll} disabled={resetting}>{resetting ? 'Resetting...' : 'Reset all rankings'}</button>
            </div>
          </div>
        )}
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error.message}</p>}
      {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
      {bulk && (
        <p role="status" className="mb-4 rounded-card bg-sage p-3 text-sm">
          {bulk.running
            ? `Ranking… ${bulk.done + bulk.failed} / ${bulk.total} done${bulk.waiting ? ' (waiting for AI cooldown)' : ''}`
            : `Done: ${bulk.done} ranked${bulk.failed ? `, ${bulk.failed} failed` : ''}`}
          {bulk.lastError && ` (${bulk.lastError})`}
        </p>
      )}

      <input className={`${input} mb-3`} type="text" placeholder="Search ideas..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="mb-3 flex flex-wrap gap-2">
        {['all', 'new', 'inprogress', 'completed', 'rejected'].map((s) => (
          <TagPill key={s} active={status === s} onClick={() => setStatus(s)}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </TagPill>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {allTags.map((t) => (
            <TagPill
              key={t}
              active={tagFilter.has(t)}
              onClick={() => {
                const next = new Set(tagFilter);
                if (next.has(t)) next.delete(t);
                else next.add(t);
                setTagFilter(next);
              }}
            >
              {t}
            </TagPill>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-card bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate">
            <tr>
              <th className={th} onClick={() => toggleSort('title')}>Title {icon('title')}</th>
              <th className={th} onClick={() => toggleSort('status')}>Status {icon('status')}</th>
              <th className={th} onClick={() => toggleSort('tags')}>Tags {icon('tags')}</th>
              <th className={th} onClick={() => toggleSort('rank')}>Rank {icon('rank')}</th>
              <th className={th} onClick={() => toggleSort('date')}>Date {icon('date')}</th>
              <th className="p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const score = i.ranked ? computeScore(i.scores, criteria) : null;
              return (
                <tr key={i.slug} data-testid={`row-${i.slug}`} className="cursor-pointer border-t border-sage hover:bg-cream" onClick={() => navigate(`/ideas/${i.slug}`)}>
                  <td className="p-3 font-semibold">
                    {i.title}
                    {i.excerpt && <span className="block truncate text-xs font-normal text-slate">{i.excerpt}</span>}
                  </td>
                  <td className="p-3">{STATUS_LABEL[i.status] ?? i.status}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{i.tags.map((t) => <TagPill key={t}>{t}</TagPill>)}</div></td>
                  <td className="p-3">
                    {i.ranked ? (
                      score !== null && <span className="font-semibold">{score}</span>
                    ) : (
                      <span className="text-slate">
                        {'—'}
                        {isAdmin && (
                          <>
                            {' '}
                            <Link to="/ideas/rank" onClick={(e) => e.stopPropagation()} className="text-teal-secondary underline">rank it →</Link>
                          </>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="p-3">{i.date || '—'}</td>
                  <td className="p-3">
                    {i.link && (
                      <a href={i.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open link" className="text-teal-secondary">↗</a>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate">No ideas found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && showAdd && <AddIdeaModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
