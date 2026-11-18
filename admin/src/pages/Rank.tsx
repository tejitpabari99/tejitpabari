import { useState } from 'react';
import { Link } from 'react-router-dom';
import Markdown from '../components/Markdown';
import { useLoader } from '../hooks/useLoader';
import { rankIdea } from '../lib/ai.js';
import { computeScore, getIdea, listIdeas, setRanking } from '../lib/ideas.js';
import { getCriteria } from '../lib/settings.js';
import type { Criterion } from '../types';
import type { IdeaRow } from './ideas-utils';

const ghost = 'rounded-pill border border-teal-secondary px-3 py-1 text-xs font-semibold text-teal-secondary hover:bg-teal-secondary hover:text-white disabled:opacity-40';
const primary = 'rounded-pill bg-teal px-3 py-1 text-xs font-semibold text-white disabled:opacity-40';

function Card({ idea, criteria, index, count, onDone, onSkip }: { idea: IdeaRow; criteria: Criterion[]; index: number; count: number; onDone: () => void; onSkip: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>({ ...idea.scores });
  const [busy, setBusy] = useState<'' | 'auto' | 'save'>('');
  const [error, setError] = useState('');
  const [more, setMore] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const live = computeScore(scores, criteria);

  async function toggleMore() {
    if (!showMore && more === null) {
      try {
        const full = await getIdea(idea.slug);
        setMore(full?.content ?? '');
      } catch (e) {
        setError((e as Error).message || 'Failed to load');
        return;
      }
    }
    setShowMore(!showMore);
  }
  async function autoRank() {
    setBusy('auto');
    setError('');
    try {
      const full = await getIdea(idea.slug);
      if (!full) throw new Error('Idea not found');
      const res = await rankIdea({ title: full.title, brief: full.brief, content: full.content }, criteria);
      await setRanking(idea.slug, { scores: { ...scores, ...res.scores }, analysis: res.analysis || '' });
      onDone();
    } catch (e) {
      setError((e as Error).message || 'Failed');
      setBusy('');
    }
  }
  async function saveNext() {
    setBusy('save');
    setError('');
    try {
      await setRanking(idea.slug, { scores, analysis: '' });
      onDone();
    } catch (e) {
      setError((e as Error).message || 'Save failed');
      setBusy('');
    }
  }

  return (
    <div className="space-y-3 rounded-card bg-white p-5">
      <span className="text-xs text-slate">{index + 1} / {count}</span>
      <h2 className="text-xl font-semibold text-teal">{idea.title}</h2>
      {idea.brief && <p className="text-sm text-slate">{idea.brief}</p>}
      <button type="button" className="text-xs text-teal-secondary underline" onClick={toggleMore}>{showMore ? 'Less ↑' : 'More ↓'}</button>
      {showMore && more !== null && <Markdown source={more} />}
      {criteria.length > 0 ? (
        criteria.map((c) => (
          <label key={c.id} className="flex items-center justify-between gap-4 text-sm">
            <span>{c.label}{c.invert && <span className="ml-2 text-xs text-slate">lower is better</span>}</span>
            <span className="flex items-center gap-2">
              <input type="range" min={1} max={5} aria-label={c.label} value={scores[c.id] ?? 1} onChange={(e) => setScores({ ...scores, [c.id]: Number(e.target.value) })} />
              <span className="w-4 text-right">{scores[c.id] ?? 1}</span>
            </span>
          </label>
        ))
      ) : (
        <p className="text-sm text-slate">No criteria configured. Set them up in <Link to="/settings" className="underline">Settings</Link>.</p>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-sm">Score: <strong>{live ?? '—'}</strong>/100</p>
        <div className="flex gap-2">
          <button type="button" className={ghost} onClick={autoRank} disabled={busy !== ''}>{busy === 'auto' ? 'Ranking...' : 'Auto-rank'}</button>
          <button type="button" className={ghost} onClick={onSkip} disabled={busy !== ''}>Skip</button>
          <button type="button" className={primary} onClick={saveNext} disabled={busy !== ''}>{busy === 'save' ? 'Saving...' : 'Save & Next'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Rank() {
  const { data, error } = useLoader<[IdeaRow[], Criterion[]]>(() => Promise.all([listIdeas(), getCriteria()]));
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(0);

  if (error) return <p role="alert" className="mt-10 text-sm text-red-700">{error.message}</p>;
  if (!data) return <p className="mt-10 text-sm text-slate">Loading…</p>;
  const [all, criteria] = data;
  // The queue is fixed once loaded so the count and order do not shift while ranking.
  const queue = all.filter((i) => !i.ranked && i.status === 'new').sort((a, b) => a.title.localeCompare(b.title));
  const total = queue.length;
  const finished = total === 0 || current >= total;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal">Rank Ideas</h1>
          <p className="text-sm text-slate">{total === 0 ? 'No unranked ideas.' : `${saved} of ${total} ranked`}</p>
        </div>
        <Link to="/ideas" className="text-sm text-slate hover:text-teal">← Back to ideas</Link>
      </div>
      {finished ? (
        <div className="space-y-3 text-center">
          <p className="text-slate">{total === 0 ? 'No unranked ideas to review.' : 'All done! Every idea has been reviewed.'}</p>
          <Link to="/ideas" className={ghost}>← Back to ideas</Link>
        </div>
      ) : (
        <Card
          key={queue[current].slug}
          idea={queue[current]}
          criteria={criteria}
          index={current}
          count={total}
          onDone={() => {
            setSaved((n) => n + 1);
            setCurrent((n) => n + 1);
          }}
          onSkip={() => setCurrent((n) => n + 1)}
        />
      )}
    </div>
  );
}
