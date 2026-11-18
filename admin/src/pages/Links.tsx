import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { TagPill } from '@site/components/TagPill';
import { useAuth } from '../auth/useAuth';
import { useLoader } from '../hooks/useLoader';
import { deleteLink, listLinks, saveLink, validateLink } from '../lib/links.js';
import type { Link } from '../types';
import { hostname, isExpired, parseTags, shortDisplay, shortUrl } from './links-utils';

type LinkRow = Link & { expiresAt?: string | null };

const input = 'w-full rounded-card border border-teal-secondary/30 bg-white px-3 py-2 text-sm';
const ghost = 'rounded-pill border border-teal-secondary px-3 py-1 text-xs font-semibold text-teal-secondary hover:bg-teal-secondary hover:text-white';

function QrModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then((m) => (m.default ?? m).toCanvas(canvas.current, shortUrl(slug), { width: 384, margin: 2 }))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function download() {
    const a = document.createElement('a');
    a.href = canvas.current!.toDataURL('image/png');
    a.download = `qr-${slug.replace(/\//g, '-')}.png`;
    a.click();
  }
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label="QR code" className="rounded-card bg-cream p-6" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-sm font-semibold text-teal">QR: {shortDisplay(slug)}</p>
        {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
        <canvas ref={canvas} className="mx-auto" />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className={ghost} onClick={download}>Download PNG</button>
          <button type="button" className={ghost} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function LinkForm({ editing, onClose, onSaved }: { editing: LinkRow | null; onClose: () => void; onSaved: () => void }) {
  const [slug, setSlug] = useState(editing?.slug ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [tags, setTags] = useState((editing?.tags ?? []).join(', '));
  const [expires, setExpires] = useState(editing?.expiresAt ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const normSlug = slug.trim().toLowerCase();
    const normUrl = url.trim();
    const invalid = validateLink({ slug: normSlug, url: normUrl });
    if (invalid) return setError(invalid);
    setSaving(true);
    setError('');
    try {
      await saveLink({
        slug: normSlug,
        url: normUrl,
        tags: parseTags(tags),
        expiresAt: expires || null,
        description: undefined, // undefined keeps the stored description
        existingSlug: editing?.slug,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message || 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={onClose}>
      <form
        role="dialog"
        aria-label={editing ? 'Edit Link' : 'Add Link'}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-card bg-cream p-6"
      >
        <h2 className="font-semibold text-teal">{editing ? 'Edit Link' : 'Add Link'}</h2>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="f-slug" className="mb-1 block text-xs font-semibold">Slug</label>
          <input id="f-slug" className={input} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gh or projects/resume" />
          {slug.trim() && <span className="text-xs text-slate">{shortDisplay(slug.trim().toLowerCase())}</span>}
        </div>
        <div>
          <label htmlFor="f-url" className="mb-1 block text-xs font-semibold">Destination URL</label>
          <input id="f-url" className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </div>
        <div>
          <label htmlFor="f-tags" className="mb-1 block text-xs font-semibold">Tags (comma-separated)</label>
          <input id="f-tags" className={input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Dev, Personal" />
        </div>
        <div>
          <label htmlFor="f-exp" className="mb-1 block text-xs font-semibold">Expires (optional)</label>
          <input id="f-exp" type="date" className={input} value={expires} onChange={(e) => setExpires(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghost} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving || !slug.trim() || !url.trim()} className="rounded-pill bg-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Links() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const { data, error, loading, reload } = useLoader<LinkRow[]>(listLinks);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ editing: LinkRow | null } | null>(null);
  const [qrSlug, setQrSlug] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const links = useMemo(() => data ?? [], [data]);
  const allTags = useMemo(() => [...new Set(links.flatMap((l) => l.tags ?? []))].sort(), [links]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter(
      (l) =>
        (tagFilter.size === 0 || [...tagFilter].some((t) => (l.tags ?? []).includes(t))) &&
        (!q || l.slug.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.tags ?? []).some((t) => t.toLowerCase().includes(q))),
    );
  }, [links, search, tagFilter]);

  async function copy(slug: string) {
    try {
      await navigator.clipboard.writeText(shortUrl(slug));
      setCopied(slug);
      setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1500);
    } catch (e) {
      setActionError((e as Error).message || 'Copy failed');
    }
  }

  async function remove(slug: string) {
    setActionError('');
    try {
      await deleteLink(slug);
      setConfirmSlug(null);
      reload();
    } catch (e) {
      setActionError((e as Error).message || 'Delete failed');
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal">Links</h1>
          <p className="text-sm text-slate">
            {links.length} short link{links.length === 1 ? '' : 's'}
          </p>
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setForm({ editing: null })} className="rounded-pill bg-teal px-4 py-2 text-sm font-semibold text-white">
            + Add Link
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error.message}</p>}
      {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}

      <input className={`${input} mb-3`} type="text" placeholder="Search slugs or URLs…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <th className="p-3">Slug / Short URL</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Tags</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.slug} data-testid={`row-${l.slug}`} className={`border-t border-sage ${isExpired(l.expiresAt) ? 'opacity-60' : ''}`}>
                <td className="p-3">
                  <span className="block font-semibold">{l.slug}</span>
                  <span className="block text-xs text-slate">{shortDisplay(l.slug)}</span>
                  {isExpired(l.expiresAt) && <span className="mt-1 inline-block rounded-pill bg-status-building/10 px-2 text-xs text-status-building">Expired</span>}
                </td>
                <td className="max-w-xs p-3">
                  <span className="block truncate" title={l.url}>{l.url}</span>
                  <span className="text-xs text-slate">{hostname(l.url)}</span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">{(l.tags ?? []).map((t) => <TagPill key={t}>{t}</TagPill>)}</div>
                </td>
                <td className="whitespace-nowrap p-3 text-right">
                  {isAdmin && confirmSlug === l.slug ? (
                    <>
                      <span className="mr-2 text-xs">Delete?</span>
                      <button type="button" className={ghost} onClick={() => remove(l.slug)}>Yes</button>{' '}
                      <button type="button" className={ghost} onClick={() => setConfirmSlug(null)}>No</button>
                    </>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button type="button" className={ghost} onClick={() => copy(l.slug)} aria-label="Copy link">
                        {copied === l.slug ? 'Copied' : 'Copy'}
                      </button>
                      <button type="button" className={ghost} onClick={() => setQrSlug(l.slug)} aria-label="QR code">QR</button>
                      {isAdmin && (
                        <>
                          <button type="button" className={ghost} onClick={() => setForm({ editing: l })} aria-label="Edit">Edit</button>
                          <button type="button" className={ghost} onClick={() => setConfirmSlug(l.slug)} aria-label="Delete">Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate">No links found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && form && (
        <LinkForm
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
          }}
        />
      )}
      {qrSlug && <QrModal slug={qrSlug} onClose={() => setQrSlug(null)} />}
    </div>
  );
}
