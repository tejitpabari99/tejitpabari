import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const script = join(root, 'scripts/migrate-to-firestore.js');

function run(args, env = {}) {
	const clean = { ...process.env };
	delete clean.FIRESTORE_EMULATOR_HOST;
	delete clean.GOOGLE_APPLICATION_CREDENTIALS;
	return spawnSync('node', [script, ...args], { env: { ...clean, ...env }, encoding: 'utf8' });
}

function fixture({ links, settings, ideas }) {
	const dir = mkdtempSync(join(tmpdir(), 'migrate-'));
	mkdirSync(join(dir, 'ideas'));
	for (const [name, text] of Object.entries(ideas)) writeFileSync(join(dir, 'ideas', name), text);
	writeFileSync(join(dir, 'links.json'), JSON.stringify(links));
	writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings));
	return dir;
}
const settings = { guestVisibility: { '/': true, '/ideas': true, '/links': true } };
const goodIdeas = {
	'one.md': '---\ntitle: One\ndate: 2026-01-02\ntags: [a b]\nranked: true\nscores:\n  impact: 3\n---\nbody one\n',
	'two.md': '---\ntitle: Two\ndate: "2026-02-03"\ntags: []\nranked: true\nscores:\n  interest: 4\n  impact: 2\n---\nbody two\n'
};
const goodLinks = [{ slug: 'Meet', url: 'https://x.io', tags: ['m'], created: '2026-01-01', clicks: 3 }];
const EMU = { FIRESTORE_EMULATOR_HOST: '127.0.0.1:1' }; // dry-run never connects

describe('modes and credentials', () => {
	test('no creds/emulator: exits non-zero with clear message, even for dry-run', () => {
		const dir = fixture({ links: goodLinks, settings, ideas: goodIdeas });
		const r = run(['--dry-run', '--content-dir', dir]);
		assert.notEqual(r.status, 0);
		assert.match(r.stderr, /FIRESTORE_EMULATOR_HOST/);
		assert.match(r.stderr, /GOOGLE_APPLICATION_CREDENTIALS/);
		assert.equal(r.stdout.includes('DRY RUN'), false);
	});
	test('emulator mode reported; default project', () => {
		const dir = fixture({ links: goodLinks, settings, ideas: goodIdeas });
		const r = run(['--dry-run', '--content-dir', dir], EMU);
		assert.equal(r.status, 0, r.stderr + r.stdout);
		assert.match(r.stdout, /mode: emulator/);
		assert.match(r.stdout, /project: tejitpabari-99/);
	});
	test('--project overrides', () => {
		const dir = fixture({ links: goodLinks, settings, ideas: goodIdeas });
		assert.match(run(['--dry-run', '--project', 'other-p', '--content-dir', dir], EMU).stdout, /project: other-p/);
	});
});

describe('dry-run report', () => {
	test('valid fixture: counts, ids, info note, exit 0', () => {
		const dir = fixture({ links: goodLinks, settings, ideas: goodIdeas });
		const r = run(['--dry-run', '--content-dir', dir], EMU);
		assert.equal(r.status, 0);
		assert.match(r.stdout, /ideas: 2 docs/);
		assert.match(r.stdout, /links: 1 docs/);
		assert.match(r.stdout, /settings: 1 docs/);
		assert.match(r.stdout, /\bone\b/);
		assert.match(r.stdout, /\bmeet\b/);
		assert.match(r.stdout, /errors: 0/);
		assert.match(r.stdout, /1 ideas? (with scores )?missing "?interest/);
	});
	test('validation error -> exit 1, listed', () => {
		const dir = fixture({ links: [...goodLinks, { slug: 'a_b', url: 'https://x.io', created: '2026-01-01' }], settings, ideas: goodIdeas });
		const r = run(['--dry-run', '--content-dir', dir], EMU);
		assert.equal(r.status, 1);
		assert.match(r.stdout, /errors: 1/);
		assert.match(r.stdout, /a_b/);
	});
	test('non-dry-run aborts before writing on validation error', () => {
		const dir = fixture({ links: [{ slug: 'a_b', url: 'https://x.io', created: '2026-01-01' }], settings, ideas: goodIdeas });
		const r = run(['--content-dir', dir], EMU);
		assert.equal(r.status, 1);
		assert.match(r.stdout + r.stderr, /abort/i);
	});
});

describe('real migration/cc-content/', () => {
	test('dry-run counts match what is actually in migration/cc-content/', () => {
		const ideasN = readdirSync(join(root, 'migration/cc-content/ideas')).filter((f) => f.endsWith('.md')).length;
		const linksN = JSON.parse(readFileSync(join(root, 'migration/cc-content/links.json'), 'utf8')).length;
		const r = run(['--dry-run'], EMU);
		assert.match(r.stdout, new RegExp(`ideas: ${ideasN} docs`));
		assert.match(r.stdout, new RegExp(`links: ${linksN} docs`));
		assert.match(r.stdout, /settings: 1 docs/);
		assert.ok([0, 1].includes(r.status));
	});
});
