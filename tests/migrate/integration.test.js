// Runs the real script against the Firestore emulator on a copy of tests/fixtures/cc-content/.
// Needs FIRESTORE_EMULATOR_HOST (use `npm run test:migrate`); skipped otherwise.
import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { slugToDocId } from '../../admin/src/lib/slug.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = join(root, 'tests/fixtures/cc-content');
const script = join(root, 'scripts/migrate-to-firestore.js');
const HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT = 'tejitpabari-99';

// ---- expectations derived from the fixture at run time ----
const ideaFiles = readdirSync(join(FIXTURE, 'ideas')).filter((f) => f.endsWith('.md'));
const parsed = ideaFiles.map((f) => ({ slug: f.slice(0, -3), ...matter(readFileSync(join(FIXTURE, 'ideas', f), 'utf8')) }));
const rawLinks = JSON.parse(readFileSync(join(FIXTURE, 'links.json'), 'utf8'));
const rankingN = parsed.filter((p) => p.content.includes('## Ranking Analysis')).length;
const unrankedSlugs = parsed.filter((p) => p.data.ranked === undefined).map((p) => p.slug);

function makeContent() {
	const dir = mkdtempSync(join(tmpdir(), 'migint-'));
	cpSync(FIXTURE, dir, { recursive: true });
	return dir;
}
function run(args, dir) {
	return spawnSync('node', [script, '--content-dir', dir, ...args], { env: { ...process.env, FIRESTORE_EMULATOR_HOST: HOST }, encoding: 'utf8' });
}
async function clearAll() {
	const r = await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
	assert.equal(r.status, 200);
}
async function dump(db) {
	const out = {};
	for (const c of ['ideas', 'links', 'settings']) {
		const s = await db.collection(c).get();
		out[c] = Object.fromEntries(s.docs.map((d) => [d.id, d.data()]));
	}
	return out;
}

describe('emulator integration (fixture content)', { skip: !HOST && 'FIRESTORE_EMULATOR_HOST not set (run npm run test:migrate)' }, () => {
	let db;
	let dir;
	before(async () => {
		db = getFirestore(getApps()[0] ?? initializeApp({ projectId: PROJECT }));
		dir = makeContent();
		await clearAll();
	});

	test('fixture content counts (informational sanity)', () => {
		assert.equal(parsed.length, ideaFiles.length);
		assert.ok(parsed.length > 0 && rawLinks.length > 0);
		console.log(`# content: ${parsed.length} ideas, ${rawLinks.length} links, ${rankingN} with Ranking Analysis`);
	});

	test('dry-run: exit 0, reports counts, leaves collections empty', async () => {
		const r = run(['--dry-run'], dir);
		assert.equal(r.status, 0, r.stdout + r.stderr);
		assert.match(r.stdout, new RegExp(`ideas: ${parsed.length} docs`));
		assert.match(r.stdout, new RegExp(`links: ${rawLinks.length} docs`));
		assert.match(r.stdout, /settings: 1 docs/);
		assert.match(r.stdout, /errors: 0/);
		const d = await dump(db);
		assert.deepEqual([Object.keys(d.ideas).length, Object.keys(d.links).length, Object.keys(d.settings).length], [0, 0, 0]);
	});

	let first;
	test('real run: OK line with expected counts', async () => {
		const r = run([], dir);
		assert.equal(r.status, 0, r.stdout + r.stderr);
		assert.ok(r.stdout.split('\n').includes(`OK ideas ${parsed.length}/${parsed.length}, links ${rawLinks.length}/${rawLinks.length}, settings 1/1`), r.stdout);
		first = await dump(db);
		assert.equal(Object.keys(first.ideas).length, parsed.length);
		assert.equal(Object.keys(first.links).length, rawLinks.length);
		assert.deepEqual(Object.keys(first.settings), ['main']);
	});

	test('second run: identical docs, unchanged counts', async () => {
		const r = run([], dir);
		assert.equal(r.status, 0, r.stdout + r.stderr);
		const second = await dump(db);
		assert.deepEqual(second, first);
	});

	test('spot checks', () => {
		const osf = first.ideas['fixture-ranked'];
		assert.equal(typeof osf.date, 'string');
		assert.equal(osf.date, '2026-03-29');
		assert.ok(unrankedSlugs.length > 0, 'content has an idea lacking ranked');
		for (const s of unrankedSlugs) {
			assert.equal(first.ideas[s].ranked, false, s);
			assert.deepEqual(first.ideas[s].scores, {}, s);
		}
		assert.equal(first.links.meet.description, '');
		assert.equal(first.links.docs.slug, 'docs');
		assert.equal(first.links['juno~pitch-deck'].slug, 'juno/pitch-deck');
		for (const l of rawLinks) {
			const slug = l.slug.toLowerCase();
			assert.equal(first.links[slugToDocId(slug)].slug, slug, slug);
		}
		for (const l of Object.values(first.links)) {
			for (const k of ['clicks', 'lastClicked', 'redirectType']) assert.equal(k in l, false, `${l.slug} has ${k}`);
		}
		const withAnalysis = Object.values(first.ideas).filter((i) => i.body.includes('## Ranking Analysis')).length;
		assert.equal(withAnalysis, rankingN);
		for (const p of parsed) assert.equal(first.ideas[p.slug].body, p.content, `body ${p.slug}`);
		assert.deepEqual(Object.keys(first.ideas[parsed[0].slug]).sort(), ['body', 'brief', 'date', 'github', 'link', 'ranked', 'scores', 'status', 'tags', 'title']);
	});
});
