import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8'));
const go = cfg.hosting.find((h) => h.target === 'go');
const hdr = (k) => {
	let v;
	for (const e of go.headers) if (e.source === '**') for (const h of e.headers) if (h.key === k) v = h.value;
	return v;
};

test('go: rewrite ** -> /index.html', () => {
	assert.deepEqual(go.rewrites, [{ source: '**', destination: '/index.html' }]);
});
test('go: baseline + noindex + no-cache', () => {
	assert.equal(hdr('Cache-Control'), 'no-cache');
	assert.equal(hdr('X-Robots-Tag'), 'noindex');
	assert.equal(hdr('X-Content-Type-Options'), 'nosniff');
});
test('go: strict CSP', () => {
	const csp = hdr('Content-Security-Policy');
	const d = Object.fromEntries(csp.split(';').map((s) => s.trim().split(/\s+(.*)/s).slice(0, 2)));
	assert.equal(d['default-src'], "'none'");
	assert.equal(d['script-src'], "'self' https://www.googletagmanager.com");
	assert.equal(d['style-src'], "'self'");
	assert.ok(d['connect-src'].split(' ').includes('https://firestore.googleapis.com'));
	assert.ok(d['connect-src'].includes('https://www.google-analytics.com'));
	assert.equal(d['base-uri'], "'none'");
	assert.equal(d['form-action'], "'none'");
	assert.equal(d['frame-ancestors'], "'none'");
	assert.ok(!/unsafe/.test(csp));
});
