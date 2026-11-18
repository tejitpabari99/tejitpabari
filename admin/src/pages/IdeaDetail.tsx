import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TagPill } from '@site/components/TagPill';
import { useAuth } from '../auth/useAuth';
import Markdown from '../components/Markdown';
import { useLoader } from '../hooks/useLoader';
import { enhanceIdea, rankIdea } from '../lib/ai.js';
import { computeScore, deleteIdea, getIdea, resetRanking, saveIdeaContent, saveIdeaMeta, setRanking } from '../lib/ideas.js';
import { getCriteria } from '../lib/settings.js';
import type { Criterion } from '../types';
import { STATUS_LABEL, STATUS_ORDER } from './ideas-utils';

const input = 'rounded-card border border-teal-secondary/30 bg-white px-3 py-1.5 text-sm';
const ghost = 'rounded-pill border border-teal-secondary px-3 py-1 text-xs font-semibold text-teal-secondary hover:bg-teal-secondary hover:text-white disabled:opacity-40';
const primary = 'rounded-pill bg-teal px-3 py-1 text-xs font-semibold text-white disabled:opacity-40';

interface Idea {
  slug: string;
  title: string;
  status: string;
  tags: string[];
  link: string;
  github: string;
  brief: string;
  ranked: boolean;
  scores: Record<string, number>;
  content: string;
}

function EditRow({ value, onSave, onCancel, placeholder, type = 'text' }: { value: string; onSave: (v: string) => void; onCancel: () => void; placeholder?: string; type?: string }) {
  const [v, setV] = useState(value);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input
        className={input}
        type={type}
        value={v}
        placeholder={placeholder}
        autoFocus
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(v);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button type="button" className={primary} onClick={() => onSave(v)}>Save</button>
      <button type="button" className={ghost} onClick={onCancel}>Cancel</button>
    </span>
  );
}

function EnhanceModal({ idea, onClose, onSaved }: { idea: Idea; onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<'input' | 'loading' | 'preview' | 'saving'>('input');
  const [notes, setNotes] = useState('');
  const [merged, setMerged] = useState('');
  const [error, setError] = useState('');

  async function run() {
    if (!notes.trim()) return;
    setStep('loading');
    setError('');
    try {
      setMerged((await enhanceIdea(idea.content, notes)).content);
      setStep('preview');
    } catch (e) {
      setError((e as Error).message || 'Failed');
      setStep('input');
    }
  }
  async function confirm() {
    setStep('saving');
    try {
      await saveIdeaContent(idea.slug, merged);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Save failed');
      setStep('preview');
    }
  }
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label="Add More Info" className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-auto rounded-card bg-cream p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-teal">{step === 'preview' || step === 'saving' ? 'Review Merged Content' : 'Add More Info'}</h2>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {step === 'input' && (
          <>
            <p className="text-xs text-slate">Paste additional notes or details. They are merged with the existing content without adding anything new.</p>
            <textarea className={`${input} w-full`} rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste additional notes here..." />
            <div className="flex justify-end gap-2">
              <button type="button" className={ghost} onClick={onClose}>Cancel</button>
              <button type="button" className={ghost} onClick={run} disabled={!notes.trim()}>Enhance with AI</button>
            </div>
          </>
        )}
        {(step === 'loading' || step === 'saving') && <p className="text-sm text-slate">{step === 'loading' ? 'Merging…' : 'Saving…'}</p>}
        {step === 'preview' && (
          <>
            <p className="text-xs text-slate">Review the merged content before saving.</p>
            <div className="rounded-card bg-white p-3"><Markdown source={merged} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghost} onClick={() => setStep('input')}>Edit</button>
              <button type="button" className={primary} onClick={confirm}>Save Changes</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Ranking({ idea, criteria, isAdmin }: { idea: Idea; criteria: Criterion[]; isAdmin: boolean }) {
  const [scores, setScores] = useState<Record<string, number>>({ ...idea.scores });
  const [analysis, setAnalysis] = useState('');
  const [ranked, setRanked] = useState(idea.ranked);
  const [busy, setBusy] = useState<'' | 'auto' | 'save'>('');
  const [error, setError] = useState('');
  const live = computeScore(scores, criteria);

  async function autoRank() {
    setBusy('auto');
    setError('');
    try {
      const res = await rankIdea({ title: idea.title, brief: idea.brief, content: idea.content }, criteria);
      const merged = { ...scores, ...res.scores };
      await setRanking(idea.slug, { scores: merged, analysis: res.analysis || '' });
      setScores(merged);
      setAnalysis(res.analysis || '');
      setRanked(true);
    } catch (e) {
      setError((e as Error).message || 'Auto-rank failed');
    } finally {
      setBusy('');
    }
  }
  async function save() {
    setBusy('save');
    setError('');
    try {
      await setRanking(idea.slug, { scores, analysis });
      setAnalysis('');
      setRanked(true);
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setBusy('');
    }
  }
  async function reset() {
    if (!window.confirm('Reset ranking for this idea?')) return;
    setError('');
    try {
      await resetRanking(idea.slug);
      setScores({});
      setAnalysis('');
      setRanked(false);
    } catch (e) {
      setError((e as Error).message || 'Reset failed');
    }
  }

  return (
    <section className="mt-8 space-y-3 rounded-card bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-teal">Ranking</h2>
        {ranked && <span className="rounded-pill bg-sage px-2 py-0.5 text-xs">Ranked</span>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {criteria.map((c) => (
        <label key={c.id} className="flex items-center justify-between gap-4 text-sm">
          <span>
            {c.label}
            {c.invert && <span className="ml-2 text-xs text-slate">lower is better</span>}
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              aria-label={c.label}
              value={scores[c.id] ?? 1}
              disabled={!isAdmin}
              onChange={(e) => setScores({ ...scores, [c.id]: parseInt(e.target.value, 10) })}
            />
            <span className="w-4 text-right">{scores[c.id] ?? '—'}</span>
          </span>
        </label>
      ))}
      {analysis && (
        <p className="rounded-card bg-sage p-3 text-sm"><span className="block text-xs text-slate">Auto-rank analysis</span>{analysis}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm">Score: <strong>{live ?? '—'}</strong>/100</p>
        {isAdmin && (
          <div className="flex gap-2">
            <button type="button" className={ghost} onClick={autoRank} disabled={busy !== ''}>{busy === 'auto' ? 'Ranking...' : 'Auto-rank'}</button>
            {ranked && <button type="button" className={ghost} onClick={reset}>Reset</button>}
            <button type="button" className={primary} onClick={save} disabled={busy !== ''}>{busy === 'save' ? 'Saving...' : 'Save ranking'}</button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function IdeaDetail() {
  const { slug = '' } = useParams();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const navigate = useNavigate();
  const { data, error, reload } = useLoader<[Idea | null, Criterion[]]>(
    () => Promise.all([getIdea(slug), getCriteria()]),
    [slug],
  );
  const [editing, setEditing] = useState<'' | 'title' | 'tags' | 'link' | 'github'>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEnhance, setShowEnhance] = useState(false);
  const [actionError, setActionError] = useState('');

  if (error) return <p role="alert" className="mt-10 text-sm text-red-700">{error.message}</p>;
  if (!data) return <p className="mt-10 text-sm text-slate">Loading…</p>;
  const [idea, criteria] = data;
  if (!idea) {
    return (
      <div className="mt-10 text-center">
        <p className="text-slate">Idea not found.</p>
        <Link to="/ideas" className="text-teal-secondary underline">Back to Ideas</Link>
      </div>
    );
  }

  async function patch(partial: Partial<Pick<Idea, 'title' | 'status' | 'tags' | 'link' | 'github'>>) {
    setActionError('');
    try {
      await saveIdeaMeta(idea!.slug, partial as never);
      setEditing('');
      reload();
    } catch (e) {
      setActionError((e as Error).message || 'Save failed');
    }
  }
  async function doDelete() {
    setActionError('');
    try {
      await deleteIdea(idea!.slug);
      navigate('/ideas');
    } catch (e) {
      setActionError((e as Error).message || 'Delete failed');
    }
  }

  const linkBtn = 'text-xs text-teal-secondary underline';
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/ideas" className="text-sm text-slate hover:text-teal">← Ideas</Link>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button type="button" className={ghost} onClick={() => setShowEnhance(true)}>+ Add More Info</button>
            {!confirmDelete ? (
              <button type="button" className={ghost} onClick={() => setConfirmDelete(true)}>Delete</button>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                Delete?
                <button type="button" className="rounded-pill bg-red-600 px-3 py-1 text-xs font-semibold text-white" onClick={doDelete}>Yes, delete</button>
                <button type="button" className={ghost} onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            )}
          </div>
        )}
      </div>
      {actionError && <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p>}

      {editing === 'title' ? (
        <div className="mb-3">
          <EditRow value={idea.title} onCancel={() => setEditing('')} onSave={(v) => v.trim() && patch({ title: v.trim() })} />
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-teal">{idea.title}</h1>
          {isAdmin && <button type="button" aria-label="Edit title" className={linkBtn} onClick={() => setEditing('title')}>✎</button>}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <select aria-label="Status" className={input} value={idea.status} onChange={(e) => patch({ status: e.target.value })}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        ) : (
          <span className="rounded-pill bg-sage px-2 py-0.5 text-xs">{STATUS_LABEL[idea.status] ?? idea.status}</span>
        )}
        {editing === 'link' ? (
          <EditRow type="url" value={idea.link} placeholder="https://..." onCancel={() => setEditing('')} onSave={(v) => patch({ link: v.trim() })} />
        ) : (
          <>
            {idea.link && <a href={idea.link} target="_blank" rel="noopener noreferrer" aria-label="Open link" className="text-teal-secondary">↗</a>}
            {isAdmin && <button type="button" className={linkBtn} onClick={() => setEditing('link')}>{idea.link ? 'Edit link' : '+ Add link'}</button>}
          </>
        )}
        {editing === 'github' ? (
          <EditRow type="url" value={idea.github} placeholder="https://github.com/..." onCancel={() => setEditing('')} onSave={(v) => patch({ github: v.trim() })} />
        ) : (
          <>
            {idea.github && <a href={idea.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-teal-secondary">GitHub</a>}
            {isAdmin && <button type="button" className={linkBtn} onClick={() => setEditing('github')}>{idea.github ? 'Edit GitHub' : '+ Add GitHub'}</button>}
          </>
        )}
      </div>

      <div className="mb-6">
        {editing === 'tags' ? (
          <EditRow
            value={idea.tags.join(', ')}
            placeholder="e.g. AI, mobile, productivity"
            onCancel={() => setEditing('')}
            onSave={(v) => patch({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {idea.tags.length ? idea.tags.map((t) => <TagPill key={t}>{t}</TagPill>) : <span className="text-xs text-slate">No tags</span>}
            {isAdmin && <button type="button" className={linkBtn} onClick={() => setEditing('tags')}>Edit tags</button>}
          </div>
        )}
      </div>

      <Markdown source={idea.content} />
      <Ranking key={idea.slug} idea={idea} criteria={criteria} isAdmin={isAdmin} />
      {isAdmin && showEnhance && <EnhanceModal idea={idea} onClose={() => setShowEnhance(false)} onSaved={reload} />}
    </div>
  );
}
