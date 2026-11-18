// Pure helpers for the go. redirector. No DOM, no network: unit-tested in node.

// Keep in sync with admin/src/lib/slug.js (tests/go checks drift). Segments joined by "/"; doc id = "/" -> "~".
const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;
export const slugToDocId = (slug) => slug.replaceAll('/', '~');

export function parseSlug(pathname) {
	const raw = String(pathname).replace(/^\/+|\/+$/g, '');
	if (raw === '') return { kind: 'empty' };
	let s;
	try {
		s = decodeURIComponent(raw);
	} catch {
		return { kind: 'invalid' };
	}
	s = s.toLowerCase();
	if (!SLUG_RE.test(s)) return { kind: 'invalid' };
	return { kind: 'slug', slug: s };
}

// Firestore REST document -> { url, expiresAt }
export function decodeLink(doc) {
	const f = (doc && doc.fields) || {};
	const url = f.url && typeof f.url.stringValue === 'string' ? f.url.stringValue : null;
	const e = f.expiresAt || {};
	const expiresAt = typeof e.stringValue === 'string' ? e.stringValue : typeof e.timestampValue === 'string' ? e.timestampValue : null;
	return { url, expiresAt };
}

// link: decoded link or null (not found).
export function classify(link, now) {
	if (!link) return { kind: 'notfound' };
	if (link.expiresAt && new Date(link.expiresAt) < now) return { kind: 'expired', expiresAt: link.expiresAt };
	let u;
	try {
		u = new URL(link.url);
	} catch {
		return { kind: 'bad' };
	}
	if (u.protocol !== 'http:' && u.protocol !== 'https:') return { kind: 'bad' };
	return { kind: 'live', url: link.url, host: u.hostname };
}

// Redirect scheduling with a hard cap (default 1500 ms) from start(). gaState: loading | ready | failed.
// Injected clock for tests. `fire` must run at most once (guarded here).
export function createRedirectTimer({ fire, now, setT, clearT, cap = 1500, settle = 300 }) {
	const deadline = now() + cap;
	let done = false;
	let timer;
	const go = () => {
		if (done) return;
		done = true;
		clearT(timer);
		fire();
	};
	const arm = () => {
		clearT(timer);
		timer = setT(go, Math.min(settle, Math.max(0, deadline - now())));
	};
	return {
		go,
		start(state) {
			if (state === 'failed') return go();
			if (state === 'ready') arm();
			else timer = setT(go, cap);
		},
		settled(state) {
			if (state === 'failed') return go();
			arm();
		}
	};
}
