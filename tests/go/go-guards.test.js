import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SLUG_RE, isValidSlug, slugToDocId } from '../../admin/src/lib/slug.js';
import { parseSlug, slugToDocId as goDocId } from '../../hosting/go/go-core.js';

const goDir = new URL('../../hosting/go/', import.meta.url);
const read = (f) => readFileSync(new URL(f, goDir), 'utf8');
const goJs = read('go.js');
const constOf = (src, name) => src.match(new RegExp(`const ${name} = '([^']*)'`))?.[1];

test('drift: go.js PROJECT_ID / API_KEY match admin/src/lib/firebase-config.js', () => {
	const cfg = readFileSync(new URL('../../admin/src/lib/firebase-config.js', import.meta.url), 'utf8');
	const projectId = cfg.match(/export const projectId = '([^']*)'/)?.[1];
	const apiKey = cfg.match(/apiKey:\s*'([^']*)'/)?.[1];
	assert.ok(projectId && apiKey);
	assert.equal(constOf(goJs, 'PROJECT_ID'), projectId);
	assert.equal(constOf(goJs, 'API_KEY'), apiKey);
	assert.equal(constOf(goJs, 'GA_ID'), 'G-9NLS3NG63M');
});

const files = readdirSync(goDir).filter((f) => statSync(new URL(f, goDir)).isFile());

test('hosting/go/ has no Firebase SDK import', () => {
	for (const f of files) assert.doesNotMatch(read(f), /from\s+['"](?:@?firebase|https:\/\/www\.gstatic\.com\/firebasejs)|import\(['"](?:@?firebase)|firebase\/(app|firestore)/i, f);
});
test('hosting/go/ HTML has no inline script body', () => {
	const html = read('index.html');
	for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) assert.equal(m[1].trim(), '', m[0]);
	assert.doesNotMatch(html, /\son\w+\s*=/i, 'inline event handler');
});
test('page weight excluding gtag < 8 KB', () => {
	const total = files.reduce((n, f) => n + statSync(new URL(f, goDir)).size, 0);
	assert.ok(total < 8 * 1024, `hosting/go/ is ${total} bytes`);
});

test('drift: go-core slug regex/mapping matches admin/src/lib/slug.js', () => {
	const core = read('go-core.js');
	assert.ok(core.includes(SLUG_RE.source), 'go-core.js must contain the same SLUG_RE source');
	for (const s of ['a', 'a/b', 'juno/pitch-deck', 'a/b/c', 'a//b', '/a', 'a/', 'a/~b', 'a~b', 'a_b', 'A/b', 'a.b', '', 'a b']) {
		const r = parseSlug('/' + s);
		if (isValidSlug(s)) assert.deepEqual(r, { kind: 'slug', slug: s }, s);
		else if (r.kind === 'slug') assert.ok(isValidSlug(r.slug), s); // only via normalization (case / edge slashes)
	}
	for (const s of ['a', 'a/b', 'juno/founder/fred']) assert.equal(goDocId(s), slugToDocId(s));
});
