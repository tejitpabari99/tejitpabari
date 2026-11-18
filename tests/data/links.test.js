import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setup, teardown } from './helpers.js';
import { __setDb, listLinks, getLink, saveLink, deleteLink, validateLink } from '../../admin/src/lib/links.js';
import * as links from '../../admin/src/lib/links.js';

let env, db;
before(async () => {
	({ env, db } = await setup());
	__setDb(db);
});
after(() => teardown({ env, db }));
beforeEach(() => env.clearFirestore());

const raw = async (id) => {
	const s = await getDoc(doc(db, 'links', id));
	return s.exists() ? s.data() : null;
};
const today = new Date().toISOString().split('T')[0];

test('validateLink messages', () => {
	assert.equal(validateLink({ slug: '', url: 'https://x' }), 'slug and url are required');
	assert.equal(validateLink({ slug: 'a', url: '' }), 'slug and url are required');
	assert.equal(validateLink({ slug: 'A b', url: 'https://x' }), 'Slug may only contain a-z, 0-9, -, /');
	assert.equal(validateLink({ slug: 'a_b', url: 'https://x' }), 'Slug may only contain a-z, 0-9, -, /');
	for (const s of ['/a', 'a/', 'a//b'])
		assert.equal(validateLink({ slug: s, url: 'https://x' }), 'Slug cannot start/end with / or contain //');
	assert.equal(validateLink({ slug: 'a', url: 'ftp://x' }), 'URL must start with http:// or https://');
	assert.equal(validateLink({ slug: 'juno/pitch-deck', url: 'https://x' }), null);
});
test('recordClick removed', () => assert.equal(links.recordClick, undefined));
test('create, get (case-insensitive), list, shape', async () => {
	assert.equal(await saveLink({ slug: 'meet', url: 'https://m', tags: ['my tag'], expiresAt: '' }), 'meet');
	const l = await getLink('MEET');
	assert.deepEqual(l, { slug: 'meet', url: 'https://m', tags: ['My Tag'], description: '', created: today, expiresAt: null });
	assert.equal(await getLink('nope'), null);
	assert.equal((await listLinks()).length, 1);
});
test('multi-segment round trip: doc id a~b, slug field a/b', async () => {
	await saveLink({ slug: 'a/b', url: 'https://x', tags: [] });
	assert.equal((await raw('a~b')).slug, 'a/b');
	assert.equal(await raw('a/b'.replace('/', '_')), null);
	assert.equal((await getLink('a/b')).slug, 'a/b');
	assert.deepEqual((await listLinks()).map((x) => x.slug), ['a/b']);
	await deleteLink('a/b');
	assert.equal(await raw('a~b'), null);
});
test('create collision rejected; invalid rejected', async () => {
	await saveLink({ slug: 'x', url: 'https://x' });
	await assert.rejects(saveLink({ slug: 'x', url: 'https://y' }), { message: 'Slug "x" already exists' });
	await assert.rejects(saveLink({ slug: 'a//b', url: 'https://y' }), { message: 'Slug cannot start/end with / or contain //' });
});
test('edit in place keeps created + description; updates fields', async () => {
	await setDoc(doc(db, 'links', 'x'), { slug: 'x', url: 'https://old', tags: [], description: 'desc', created: '2020-01-01', expiresAt: null });
	await saveLink({ slug: 'x', url: 'https://new', tags: ['t'], expiresAt: '2030-01-01', existingSlug: 'x' });
	assert.deepEqual(await raw('x'), { slug: 'x', url: 'https://new', tags: ['T'], description: 'desc', created: '2020-01-01', expiresAt: '2030-01-01' });
});
test('rename: old removed, created kept, collision rejected', async () => {
	await setDoc(doc(db, 'links', 'old'), { slug: 'old', url: 'https://o', tags: [], description: '', created: '2020-01-01', expiresAt: null });
	await setDoc(doc(db, 'links', 'taken'), { slug: 'taken', url: 'https://t', tags: [], description: '', created: '2021-01-01', expiresAt: null });
	await assert.rejects(saveLink({ slug: 'taken', url: 'https://o', existingSlug: 'old' }), { message: 'Slug "taken" already exists' });
	assert.notEqual(await raw('old'), null);
	assert.equal(await saveLink({ slug: 'juno/new', url: 'https://o2', existingSlug: 'old' }), 'juno/new');
	assert.equal(await raw('old'), null);
	const n = await raw('juno~new');
	assert.equal(n.created, '2020-01-01');
	assert.equal(n.slug, 'juno/new');
	assert.equal(n.url, 'https://o2');
});
test('edit/delete missing -> Link not found', async () => {
	await assert.rejects(saveLink({ slug: 'a', url: 'https://x', existingSlug: 'ghost' }), { message: 'Link not found' });
	await assert.rejects(deleteLink('ghost'), { message: 'Link not found' });
});
