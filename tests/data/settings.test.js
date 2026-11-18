import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setup, teardown } from './helpers.js';
import { __setDb, getSettings, saveGuestVisibility, getCriteria, saveCriteria } from '../../admin/src/lib/settings.js';

let env, db;
before(async () => {
	({ env, db } = await setup());
	__setDb(db);
});
after(() => teardown({ env, db }));
beforeEach(() => env.clearFirestore().then(() => __setDb(db)));

const ref = () => doc(db, 'settings/main');

test('missing doc -> empty guestVisibility + default criteria', async () => {
	const s = await getSettings();
	assert.deepEqual(s.guestVisibility, {});
	const c = await getCriteria();
	assert.equal(c.length, 6);
	assert.deepEqual(c[2], { id: 'time_to_build', label: 'Time to Build', weight: 1, invert: true });
});
test('getSettings memoized; cleared on write', async () => {
	await setDoc(ref(), { guestVisibility: { '/ideas': true } });
	const a = await getSettings();
	await setDoc(ref(), { guestVisibility: { '/ideas': false } }); // behind the cache's back
	assert.equal((await getSettings()).guestVisibility['/ideas'], true);
	await saveGuestVisibility({ '/': false, '/ideas': false, '/links': true });
	assert.deepEqual((await getSettings()).guestVisibility, { '/': false, '/ideas': false, '/links': true });
	assert.notEqual(a, await getSettings());
});
test('saveGuestVisibility replaces the map, keeps ranker (merge)', async () => {
	await setDoc(ref(), { guestVisibility: { '/x': true }, ranker: { criteria: [{ id: 'a', label: 'A', weight: 2, invert: false }] } });
	await saveGuestVisibility({ '/ideas': true });
	const d = (await getDoc(ref())).data();
	assert.deepEqual(d.guestVisibility, { '/ideas': true });
	assert.equal(d.ranker.criteria[0].id, 'a');
});
test('saveCriteria validates with existing messages', async () => {
	await assert.rejects(saveCriteria([]), { message: 'At least one criterion required' });
	await assert.rejects(saveCriteria('x'), { message: 'At least one criterion required' });
	await assert.rejects(saveCriteria([{ id: 'a' }]), { message: 'Each criterion needs id and label' });
	await assert.rejects(saveCriteria([{ id: 'a', label: 'A', weight: 0 }]), { message: 'Weight must be ≥ 1 (got "0" for "A")' });
	await assert.rejects(
		saveCriteria([{ id: 'a', label: 'A', weight: 1 }, { id: 'a', label: 'B', weight: 1 }]),
		{ message: 'Duplicate criterion ids' }
	);
});
test('saveCriteria normalizes, merges, preserves guestVisibility, clears cache', async () => {
	await setDoc(ref(), { guestVisibility: { '/ideas': true } });
	await getCriteria();
	await saveCriteria([{ id: 'a', label: 'A', weight: '3', invert: 1 }]);
	assert.deepEqual(await getCriteria(), [{ id: 'a', label: 'A', weight: 3, invert: true }]);
	assert.deepEqual((await getDoc(ref())).data().guestVisibility, { '/ideas': true });
});
