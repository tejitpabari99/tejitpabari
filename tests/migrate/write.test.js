import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, writeAll, verifyAll, canonical } from '../../scripts/migrate-to-firestore.js';

// ---- in-memory fake of the slice of the Admin Firestore API the script uses ----
function fakeDb({ corruptOnWrite = false, dropOnWrite = null } = {}) {
	const data = new Map(); // 'col/id' -> doc
	const log = { commits: [], reads: 0 };
	const snap = (col, id) => {
		const d = data.get(`${col}/${id}`);
		return { id, exists: d !== undefined, data: () => (d === undefined ? undefined : structuredClone(d)) };
	};
	return {
		data,
		log,
		collection(col) {
			return {
				doc: (id) => ({ _col: col, id, get: async () => (log.reads++, snap(col, id)) }),
				get: async () => {
					log.reads++;
					const docs = [...data.keys()].filter((k) => k.startsWith(col + '/')).map((k) => snap(col, k.slice(col.length + 1)));
					return { docs, size: docs.length };
				}
			};
		},
		batch() {
			const ops = [];
			return {
				set(ref, doc) {
					ops.push([ref, doc]);
				},
				async commit() {
					log.commits.push(ops.map(([r]) => `${r._col}/${r.id}`));
					for (const [r, doc] of ops) {
						if (dropOnWrite === `${r._col}/${r.id}`) continue;
						data.set(`${r._col}/${r.id}`, corruptOnWrite && r._col === 'links' ? { ...doc, url: 'https://tampered' } : structuredClone(doc));
					}
				}
			};
		}
	};
}

function content({ nIdeas = 3, links = [{ slug: 'meet', url: 'https://x.io', created: '2026-01-01' }] } = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'migw-'));
	mkdirSync(join(dir, 'ideas'));
	for (let i = 0; i < nIdeas; i++)
		writeFileSync(join(dir, 'ideas', `idea-${i}.md`), `---\ntitle: I${i}\ndate: 2026-01-02\nranked: true\nscores:\n  impact: 3\n---\nbody ${i}\n`);
	writeFileSync(join(dir, 'links.json'), JSON.stringify(links));
	writeFileSync(join(dir, 'settings.json'), JSON.stringify({ guestVisibility: { '/': true, '/ideas': true, '/links': true } }));
	return dir;
}
const collect = () => {
	const out = [];
	const err = [];
	return { out, err, io: { log: (m) => out.push(m), error: (m) => err.push(m) } };
};
const EMU = { FIRESTORE_EMULATOR_HOST: 'h:1' };
const REAL = { GOOGLE_APPLICATION_CREDENTIALS: '/nonexistent/key.json' };

describe('write order and batching', () => {
	test('settings first, then links, then ideas; batches <= 400', async () => {
		const db = fakeDb();
		const { io, out } = collect();
		const code = await main(['--content-dir', content({ nIdeas: 850 })], EMU, { ...io, getDb: async () => db });
		assert.equal(code, 0, out.join('\n'));
		const flat = db.log.commits.flat();
		assert.equal(flat[0], 'settings/main');
		assert.equal(flat[1].startsWith('links/'), true);
		assert.ok(flat.slice(2).every((k) => k.startsWith('ideas/')));
		assert.ok(db.log.commits.every((c) => c.length <= 400));
		assert.equal(db.data.size, 1 + 1 + 850);
		assert.ok(out.some((l) => l === 'OK ideas 850/850, links 1/1, settings 1/1'));
	});
	test('never touches other collections', async () => {
		const db = fakeDb();
		db.data.set('other/x', { a: 1 });
		const { io } = collect();
		await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db });
		assert.deepEqual(db.data.get('other/x'), { a: 1 });
		assert.ok(db.log.commits.flat().every((k) => /^(settings|links|ideas)\//.test(k)));
	});
	test('set overwrites: stale fields removed', async () => {
		const db = fakeDb();
		db.data.set('links/meet', { slug: 'meet', url: 'https://old', stale: true });
		const { io } = collect();
		await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db });
		assert.equal('stale' in db.data.get('links/meet'), false);
	});
});

describe('guards (real mode)', () => {
	test('no --yes: refuses, no db access, prints project + target', async () => {
		let touched = false;
		const { io, out, err } = collect();
		const code = await main(['--content-dir', content()], REAL, { ...io, getDb: async () => ((touched = true), fakeDb()) });
		assert.notEqual(code, 0);
		assert.equal(touched, false);
		assert.match(out.concat(err).join('\n'), /tejitpabari-99/);
		assert.match(err.join('\n'), /--yes/);
	});
	test('first run (empty) with --yes needs no force flag', async () => {
		const db = fakeDb();
		const { io, out } = collect();
		const code = await main(['--yes', '--content-dir', content()], REAL, { ...io, getDb: async () => db });
		assert.equal(code, 0, out.join('\n'));
		assert.ok(out.some((l) => l.startsWith('OK ')));
	});
	test('existing target doc without --force-overwrite: refuses, zero writes', async () => {
		const db = fakeDb();
		db.data.set('ideas/idea-1', { title: 'edited in firestore' });
		const { io, err } = collect();
		const code = await main(['--yes', '--content-dir', content()], REAL, { ...io, getDb: async () => db });
		assert.notEqual(code, 0);
		assert.equal(db.log.commits.length, 0);
		assert.match(err.join('\n'), /--force-overwrite/);
	});
	test('existing docs with --yes --force-overwrite: writes', async () => {
		const db = fakeDb();
		db.data.set('ideas/idea-1', { title: 'old' });
		const { io } = collect();
		const code = await main(['--yes', '--force-overwrite', '--content-dir', content()], REAL, { ...io, getDb: async () => db });
		assert.equal(code, 0);
		assert.equal(db.data.get('ideas/idea-1').title, 'I1');
	});
	test('emulator mode skips both checks', async () => {
		const db = fakeDb();
		db.data.set('ideas/idea-1', { title: 'old' });
		const { io } = collect();
		assert.equal(await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db }), 0);
	});
	test('validation error: no writes even with --yes', async () => {
		const db = fakeDb();
		const { io } = collect();
		const code = await main(['--yes', '--content-dir', content({ links: [{ slug: 'a_b', url: 'https://x.io', created: '2026-01-01' }] })], REAL, { ...io, getDb: async () => db });
		assert.equal(code, 1);
		assert.equal(db.log.commits.length, 0);
	});
});

describe('verify', () => {
	test('canonical ignores key order', () => {
		assert.equal(canonical({ a: 1, b: { c: [1, { y: 1, x: 2 }], d: 2 } }), canonical({ b: { d: 2, c: [1, { x: 2, y: 1 }] }, a: 1 }));
		assert.notEqual(canonical({ a: 1 }), canonical({ a: 2 }));
	});
	test('mismatch -> non-zero and diff printed', async () => {
		const db = fakeDb({ corruptOnWrite: true });
		const { io, out, err } = collect();
		const code = await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db });
		assert.notEqual(code, 0);
		assert.equal(out.some((l) => l.startsWith('OK ')), false);
		assert.match(out.concat(err).join('\n'), /links\/meet/);
	});
	test('missing doc -> non-zero', async () => {
		const db = fakeDb({ dropOnWrite: 'ideas/idea-2' });
		const { io, out, err } = collect();
		const code = await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db });
		assert.notEqual(code, 0);
		assert.match(out.concat(err).join('\n'), /missing.*ideas\/idea-2/);
	});
	test('extra docs are info only', async () => {
		const db = fakeDb();
		db.data.set('ideas/created-in-ui', { title: 'x' });
		const { io, out } = collect();
		const code = await main(['--content-dir', content()], EMU, { ...io, getDb: async () => db });
		assert.equal(code, 0);
		assert.ok(out.some((l) => /info:.*1 extra.*ideas/.test(l)));
		assert.ok(out.some((l) => l === 'OK ideas 3/3, links 1/1, settings 1/1'));
		assert.ok(db.data.has('ideas/created-in-ui'));
	});
});
