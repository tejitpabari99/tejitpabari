import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSlug, slugToDocId, decodeLink, classify } from '../../hosting/go/go-core.js';

test('parseSlug: basic, case, slashes', () => {
	assert.deepEqual(parseSlug('/meet'), { kind: 'slug', slug: 'meet' });
	assert.deepEqual(parseSlug('/LIVE/'), { kind: 'slug', slug: 'live' });
	assert.deepEqual(parseSlug('//a-1//'), { kind: 'slug', slug: 'a-1' });
});
test('parseSlug: multi-segment', () => {
	assert.deepEqual(parseSlug('/a/b'), { kind: 'slug', slug: 'a/b' });
	assert.deepEqual(parseSlug('/A/B/'), { kind: 'slug', slug: 'a/b' });
	assert.deepEqual(parseSlug('/juno/pitch-deck'), { kind: 'slug', slug: 'juno/pitch-deck' });
	assert.deepEqual(parseSlug('/juno/founder/fred/'), { kind: 'slug', slug: 'juno/founder/fred' });
	assert.deepEqual(parseSlug('/a%2Fb'), { kind: 'slug', slug: 'a/b' }); // encoded slash decodes to a valid slug
});
test('slugToDocId', () => {
	assert.equal(slugToDocId('juno/pitch-deck'), 'juno~pitch-deck');
	assert.equal(slugToDocId('meet'), 'meet');
});
test('parseSlug: empty', () => {
	for (const p of ['', '/', '//']) assert.deepEqual(parseSlug(p), { kind: 'empty' }, p);
});
test('parseSlug: encoded', () => {
	assert.deepEqual(parseSlug('/Me%65t'), { kind: 'slug', slug: 'meet' });
});
test('parseSlug: invalid shapes', () => {
	for (const p of ['/a_b', '/a//b', '/a/~b', '/a~b', '/a.b', '/a/b_c', '/%E0%A4%A', '/a%3Fx%3D1', '/a b', '/%2e%2e', '/a/../b'])
		assert.deepEqual(parseSlug(p), { kind: 'invalid' }, p);
});

test('decodeLink: expiresAt variants', () => {
	assert.deepEqual(decodeLink({ fields: { url: { stringValue: 'https://x.com' }, expiresAt: { nullValue: null } } }), { url: 'https://x.com', expiresAt: null });
	assert.deepEqual(decodeLink({ fields: { url: { stringValue: 'https://x.com' }, expiresAt: { stringValue: '2020-01-01' } } }), { url: 'https://x.com', expiresAt: '2020-01-01' });
	assert.deepEqual(decodeLink({ fields: { url: { stringValue: 'https://x.com' }, expiresAt: { timestampValue: '2020-01-01T00:00:00Z' } } }), { url: 'https://x.com', expiresAt: '2020-01-01T00:00:00Z' });
	assert.deepEqual(decodeLink({ fields: { url: { stringValue: 'https://x.com' } } }), { url: 'https://x.com', expiresAt: null });
});
test('decodeLink: missing/garbage', () => {
	assert.deepEqual(decodeLink({}), { url: null, expiresAt: null });
	assert.deepEqual(decodeLink(null), { url: null, expiresAt: null });
	assert.equal(decodeLink({ fields: { url: { integerValue: '1' } } }).url, null);
});

const now = new Date('2026-06-15T12:00:00Z');
test('classify: live / notfound', () => {
	assert.equal(classify({ url: 'https://x.com/p?q=1', expiresAt: null }, now).kind, 'live');
	assert.equal(classify({ url: 'http://x.com', expiresAt: '2030-01-01' }, now).kind, 'live');
	assert.equal(classify(null, now).kind, 'notfound');
});
test('classify: expired + date-only boundary', () => {
	const r = classify({ url: 'https://x.com', expiresAt: '2020-01-01' }, now);
	assert.equal(r.kind, 'expired');
	assert.equal(r.expiresAt, '2020-01-01');
	assert.equal(classify({ url: 'https://x.com', expiresAt: '2026-06-15' }, now).kind, 'expired'); // midnight UTC today passed
	assert.equal(classify({ url: 'https://x.com', expiresAt: '2026-06-16' }, now).kind, 'live');
	assert.equal(classify({ url: 'https://x.com', expiresAt: '2026-06-15' }, new Date('2026-06-14T23:59:59Z')).kind, 'live');
});
test('classify: invalid date = not expired', () => {
	assert.equal(classify({ url: 'https://x.com', expiresAt: 'garbage' }, now).kind, 'live');
});
test('classify: bad urls', () => {
	for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'JavaScript:alert(1)', '/relative', 'not a url', '', null, undefined, 'ftp://x.com'])
		assert.equal(classify({ url, expiresAt: null }, now).kind, 'bad', String(url));
});
test('classify: live exposes url and host', () => {
	const r = classify({ url: 'https://Example.com/a', expiresAt: null }, now);
	assert.equal(r.url, 'https://Example.com/a');
	assert.equal(r.host, 'example.com');
});

// ---- redirect scheduling: hard 1500 ms cap after link resolved ----
function fakeClock() {
	let t = 0;
	let seq = 0;
	const timers = new Map();
	return {
		now: () => t,
		setT: (fn, ms) => (timers.set(++seq, { fn, at: t + ms }), seq),
		clearT: (id) => timers.delete(id),
		advanceTo(target) {
			for (;;) {
				const next = [...timers.entries()].filter(([, x]) => x.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
				if (!next) break;
				t = next[1].at;
				timers.delete(next[0]);
				next[1].fn();
			}
			t = target;
		}
	};
}
test('redirect timer: gtag settles at 1499 ms -> fires by 1500 ms, once', async () => {
	const { createRedirectTimer } = await import('../../hosting/go/go-core.js');
	const c = fakeClock();
	let fired = [];
	const rt = createRedirectTimer({ fire: () => fired.push(c.now()), ...c });
	rt.start('loading');
	c.advanceTo(1499);
	assert.equal(fired.length, 0);
	rt.settled('ready');
	c.advanceTo(3000);
	assert.deepEqual(fired, [1500]);
});
test('redirect timer: ready at start -> 300 ms; settle mid-wait -> 300 ms from settle; failed -> immediate; fire once', async () => {
	const { createRedirectTimer } = await import('../../hosting/go/go-core.js');
	let c = fakeClock();
	let fired = [];
	let rt = createRedirectTimer({ fire: () => fired.push(c.now()), ...c });
	rt.start('ready');
	c.advanceTo(2000);
	assert.deepEqual(fired, [300]);
	c = fakeClock();
	fired = [];
	rt = createRedirectTimer({ fire: () => fired.push(c.now()), ...c });
	rt.start('loading');
	c.advanceTo(100);
	rt.settled('ready');
	c.advanceTo(2000);
	assert.deepEqual(fired, [400]);
	c = fakeClock();
	fired = [];
	rt = createRedirectTimer({ fire: () => fired.push(c.now()), ...c });
	rt.start('loading');
	c.advanceTo(50);
	rt.settled('failed');
	c.advanceTo(2000);
	assert.deepEqual(fired, [50]);
	c = fakeClock();
	fired = [];
	rt = createRedirectTimer({ fire: () => fired.push(c.now()), ...c });
	rt.start('loading');
	c.advanceTo(2000);
	rt.settled('ready');
	c.advanceTo(3000);
	assert.deepEqual(fired, [1500]);
});
