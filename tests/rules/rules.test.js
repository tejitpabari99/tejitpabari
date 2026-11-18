import assert from 'node:assert/strict';
import { test, before, after, beforeEach, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
	initializeTestEnvironment,
	assertSucceeds,
	assertFails
} from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { ADMIN_EMAILS } from '../../admin/src/lib/config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ADMIN = 'tejitpabari99@gmail.com';

let env;

before(async () => {
	env = await initializeTestEnvironment({
		projectId: 'tejitpabari-99',
		firestore: {
			rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8'),
			host: '127.0.0.1',
			port: 8080
		}
	});
});
after(async () => {
	await env?.cleanup();
});
beforeEach(async () => {
	await env.clearFirestore();
});

const seed = async (toggles) => {
	await env.withSecurityRulesDisabled(async (ctx) => {
		const db = ctx.firestore();
		if (toggles) await setDoc(doc(db, 'settings/main'), { guestVisibility: toggles });
		await setDoc(doc(db, 'ideas/a'), { title: 'A' });
		await setDoc(doc(db, 'links/a'), { slug: 'a', url: 'https://x.test' });
	});
};

const actors = {
	admin: { admin: true, db: () => env.authenticatedContext('adm', { email: ADMIN, email_verified: true }).firestore() },
	'admin email unverified': { db: () => env.authenticatedContext('u1', { email: ADMIN, email_verified: false }).firestore() },
	'other Google user': { db: () => env.authenticatedContext('u2', { email: 'other@gmail.com', email_verified: true }).firestore() },
	anon: { db: () => env.unauthenticatedContext().firestore() }
};

for (const [name, actor] of Object.entries(actors)) {
	describe(name, () => {
		const toggleCases = [[false], [true]];
		for (const [on] of toggleCases) {
			const gate = actor.admin ? assertSucceeds : on ? assertSucceeds : assertFails;
			test(`ideas read (toggles ${on})`, async () => {
				await seed({ '/ideas': on, '/links': on });
				await gate(getDoc(doc(actor.db(), 'ideas/a')));
				await gate(getDocs(collection(actor.db(), 'ideas')));
			});
			test(`links list (toggles ${on})`, async () => {
				await seed({ '/ideas': on, '/links': on });
				await gate(getDocs(collection(actor.db(), 'links')));
			});
			test(`links get always ok (toggles ${on})`, async () => {
				await seed({ '/ideas': on, '/links': on });
				await assertSucceeds(getDoc(doc(actor.db(), 'links/a')));
			});
			test(`settings read ok (toggles ${on})`, async () => {
				await seed({ '/ideas': on, '/links': on });
				await assertSucceeds(getDoc(doc(actor.db(), 'settings/main')));
			});
		}
		const w = actor.admin ? assertSucceeds : assertFails;
		test('ideas write', async () => {
			await seed({ '/ideas': true, '/links': true });
			await w(setDoc(doc(actor.db(), 'ideas/b'), { title: 'B' }));
			await w(setDoc(doc(actor.db(), 'ideas/a'), { title: 'A2' }));
			await w(deleteDoc(doc(actor.db(), 'ideas/a')));
		});
		test('links write', async () => {
			await seed({ '/ideas': true, '/links': true });
			await w(setDoc(doc(actor.db(), 'links/b'), { slug: 'b', url: 'https://y.test' }));
			await w(deleteDoc(doc(actor.db(), 'links/a')));
		});
		test('settings write', async () => {
			await seed({ '/ideas': true, '/links': true });
			await w(setDoc(doc(actor.db(), 'settings/main'), { guestVisibility: { '/ideas': false } }));
		});
		test('settings/other denied for read and write (default deny)', async () => {
			await seed({ '/ideas': true, '/links': true });
			await assertFails(getDoc(doc(actor.db(), 'settings/other')));
			await assertFails(setDoc(doc(actor.db(), 'settings/other'), { a: 1 }));
		});
		test('unknown collection denied', async () => {
			await seed({ '/ideas': true, '/links': true });
			await assertFails(getDoc(doc(actor.db(), 'secrets/x')));
			await assertFails(setDoc(doc(actor.db(), 'secrets/x'), { a: 1 }));
		});
	});
}

describe('missing settings/main', () => {
	test('guests cannot read ideas', async () => {
		await seed(null);
		for (const k of ['other Google user', 'anon', 'admin email unverified']) {
			await assertFails(getDoc(doc(actors[k].db(), 'ideas/a')));
			await assertFails(getDocs(collection(actors[k].db(), 'ideas')));
		}
	});
	test('guests cannot list links, get still ok', async () => {
		await seed(null);
		await assertFails(getDocs(collection(actors.anon.db(), 'links')));
		await assertSucceeds(getDoc(doc(actors.anon.db(), 'links/a')));
	});
	test('anon get of multi-segment link doc (links/juno~pitch-deck) ok, list still gated', async () => {
		await seed(null);
		await env.withSecurityRulesDisabled(async (ctx) => {
			await setDoc(doc(ctx.firestore(), 'links/juno~pitch-deck'), { slug: 'juno/pitch-deck', url: 'https://x.test' });
		});
		await assertSucceeds(getDoc(doc(actors.anon.db(), 'links/juno~pitch-deck')));
		await assertFails(getDocs(collection(actors.anon.db(), 'links')));
	});
	test('admin can still read ideas', async () => {
		await seed(null);
		await assertSucceeds(getDoc(doc(actors.admin.db(), 'ideas/a')));
	});
});

describe('guest toggle per prefix', () => {
	test('/links toggle does not open ideas and vice versa', async () => {
		await seed({ '/ideas': false, '/links': true });
		await assertFails(getDocs(collection(actors.anon.db(), 'ideas')));
		await assertSucceeds(getDocs(collection(actors.anon.db(), 'links')));
		await seed({ '/ideas': true, '/links': false });
		await assertSucceeds(getDocs(collection(actors.anon.db(), 'ideas')));
		await assertFails(getDocs(collection(actors.anon.db(), 'links')));
	});
});

test('admin email set matches between config.js and firestore.rules', () => {
	const rules = readFileSync(resolve(root, 'firestore.rules'), 'utf8');
	const m = rules.match(/request\.auth\.token\.email\s+in\s+\[([^\]]*)\]/);
	if (!m) throw new Error('admin email list not found in firestore.rules');
	const fromRules = [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] ?? x[2]).sort();
	const fromConfig = [...ADMIN_EMAILS].sort();
	if (fromRules.length === 0) throw new Error('no emails parsed from rules');
	assert.deepEqual(fromRules, fromConfig);
});
