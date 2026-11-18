import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8'));
const IMMUTABLE = 'public,max-age=31536000,immutable';

// Firebase applies matching header entries in order; later same-key entries win
// (verified with the hosting emulator). Header `source` matches the REQUEST path,
// not the rewrite destination, so SPA deep links need the catch-all no-cache.
function cacheControl(target, path) {
	const site = cfg.hosting.find((h) => h.target === target);
	let v;
	for (const e of site.headers) {
		const m =
			e.source === '**' ||
			(e.source === '/assets/**' && path.startsWith('/assets/')) ||
			(e.source === '**/assets/**' && path.includes('/assets/')) ||
			(e.source === '**/index.html' && path.endsWith('/index.html'));
		if (!m) continue;
		for (const h of e.headers) if (h.key === 'Cache-Control') v = h.value.replace(/, /g, ',');
	}
	return v;
}

test('admin: every SPA/HTML path is no-cache', () => {
	for (const p of ['/', '/ideas/foo', '/links', '/index.html']) assert.equal(cacheControl('admin', p), 'no-cache', p);
});
test('admin: only /assets/** is immutable', () => {
	assert.equal(cacheControl('admin', '/assets/x.js'), IMMUTABLE);
	assert.equal(cacheControl('admin', '/ideas/foo'), 'no-cache');
});
test('main: index.html no-cache, assets immutable', () => {
	assert.equal(cacheControl('main', '/index.html'), 'no-cache');
	assert.equal(cacheControl('main', '/assets/x.js'), IMMUTABLE);
});
test('go: everything no-cache', () => {
	for (const p of ['/', '/anything', '/index.html']) assert.equal(cacheControl('go', p), 'no-cache', p);
});
test('security headers kept on all targets; admin immutable entry is last (wins)', () => {
	for (const h of cfg.hosting) {
		const keys = h.headers[0].headers.map((x) => x.key);
		for (const k of ['X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security']) assert.ok(keys.includes(k), k);
	}
	const admin = cfg.hosting.find((h) => h.target === 'admin');
	assert.equal(admin.headers.at(-1).source, '/assets/**');
});
