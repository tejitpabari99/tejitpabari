import { useState } from 'react';
import { useLoader } from '../hooks/useLoader';
import { getCriteria, getSettings, saveCriteria, saveGuestVisibility } from '../lib/settings.js';

const PAGES = [
  { path: '/', label: 'Home' },
  { path: '/ideas', label: 'Ideas' },
  { path: '/links', label: 'Links' },
];
const input = 'rounded-card border border-teal-secondary/30 bg-white px-3 py-1.5 text-sm';
const ghost = 'rounded-pill border border-teal-secondary px-3 py-1 text-xs font-semibold text-teal-secondary hover:bg-teal-secondary hover:text-white disabled:opacity-40';
const primary = 'rounded-pill bg-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40';

interface Row {
  id: string;
  label: string;
  weight: string;
  invert: boolean;
}

const deriveId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function Visibility({ initial }: { initial: Record<string, boolean> }) {
  const [vis, setVis] = useState<Record<string, boolean>>(() => Object.fromEntries(PAGES.map((p) => [p.path, initial[p.path] === true])));
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  async function save() {
    setMsg('');
    setError('');
    try {
      await saveGuestVisibility(vis);
      setMsg('Settings saved.');
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    }
  }
  return (
    <section className="mb-8 rounded-card bg-white p-5">
      <h2 className="font-semibold text-teal">Guest Visibility</h2>
      <p className="mb-3 text-sm text-slate">Control which pages guests can view without signing in.</p>
      {msg && <p role="status" className="mb-2 text-sm text-teal-secondary">{msg}</p>}
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      <div className="mb-3 space-y-2">
        {PAGES.map((p) => (
          <label key={p.path} className="flex items-center justify-between text-sm">
            <span>{p.label} <span className="text-xs text-slate">{p.path}</span></span>
            <input type="checkbox" aria-label={`${p.label} ${p.path}`} checked={vis[p.path]} onChange={(e) => setVis({ ...vis, [p.path]: e.target.checked })} />
          </label>
        ))}
      </div>
      <button type="button" className={primary} onClick={save}>Save</button>
    </section>
  );
}

function Criteria({ initial }: { initial: { id: string; label: string; weight: number; invert: boolean }[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((c) => ({ ...c, weight: String(c.weight) })));
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const patch = (i: number, p: Partial<Row>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  function onLabelBlur(i: number) {
    if (rows[i].id) return;
    const base = deriveId(rows[i].label);
    const existing = rows.filter((_, idx) => idx !== i).map((r) => r.id).filter(Boolean);
    let id = base;
    for (let n = 2; id && existing.includes(id); n++) id = `${base}_${n}`;
    patch(i, { id });
  }
  async function save() {
    setMsg('');
    setError('');
    try {
      await saveCriteria(rows);
      setMsg('Criteria saved.');
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    }
  }
  return (
    <section className="rounded-card bg-white p-5">
      <h2 className="font-semibold text-teal">Ranking Criteria</h2>
      <p className="mb-3 text-sm text-slate">Weights control relative importance. Inverted criteria treat lower scores as better (e.g. Time to Build).</p>
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      {msg && <p role="status" className="mb-2 text-sm text-teal-secondary">{msg}</p>}
      <div className="mb-3 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <input className={`${input} w-full`} placeholder="Label" value={r.label} onChange={(e) => patch(i, { label: e.target.value })} onBlur={() => onLabelBlur(i)} />
              {r.id && <span className="text-xs text-slate">id: {r.id}</span>}
            </div>
            <input className={`${input} w-20`} type="number" min={1} placeholder="Weight" value={r.weight} onChange={(e) => patch(i, { weight: e.target.value })} />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={r.invert} onChange={(e) => patch(i, { invert: e.target.checked })} /> Invert
            </label>
            <button type="button" aria-label="Remove criterion" className="text-slate hover:text-red-700" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button type="button" className={ghost} onClick={() => setRows([...rows, { id: '', label: '', weight: '1', invert: false }])}>+ Add criterion</button>
        <button type="button" className={primary} onClick={save}>Save criteria</button>
      </div>
    </section>
  );
}

export default function Settings() {
  const { data, error } = useLoader(() => Promise.all([getSettings(), getCriteria()]));
  if (error) return <p role="alert" className="mt-10 text-sm text-red-700">{error.message}</p>;
  if (!data) return <p className="mt-10 text-sm text-slate">Loading…</p>;
  const [settings, criteria] = data;
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-teal">Settings</h1>
      <p className="mb-6 text-sm text-slate">Manage site configuration.</p>
      <Visibility initial={settings.guestVisibility || {}} />
      <Criteria initial={criteria} />
    </div>
  );
}
