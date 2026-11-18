import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { parseSlug, slugToDocId, decodeLink, classify } from '../../hosting/go/go-core.js';

const PROJECT = 'tejitpabari-99';
const BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
let env;

before(async () => {
	env = await initializeTestEnvironment({
		projectId: PROJECT,
		firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 }
	});
	await env.clearFirestore();
	await env.withSecurityRulesDisabled(async (c) => {
		await setDoc(doc(c.firestore(), 'links', 'live'), { url: 'https://example.com/x', expiresAt: null });
		await setDoc(doc(c.firestore(), 'links', 'juno~pitch-deck'), { slug: 'juno/pitch-deck', url: 'https://example.com/deck', expiresAt: null });
		await setDoc(doc(c.firestore(), 'links', 'dated'), { url: 'https://example.com/y', expiresAt: '2020-01-01' });
	});
});
after(async () => {
	await env?.cleanup();
});

test('unauthenticated GET of existing link: 200 + decodable', async () => {
	const r = await fetch(`${BASE}/links/live`);
	assert.equal(r.status, 200);
	const link = decodeLink(await r.json());
	assert.deepEqual(link, { url: 'https://example.com/x', expiresAt: null });
	assert.equal(classify(link, new Date()).kind, 'live');
});
test('stored string expiresAt decodes and classifies expired', async () => {
	const link = decodeLink(await (await fetch(`${BASE}/links/dated`)).json());
	assert.equal(link.expiresAt, '2020-01-01');
	assert.equal(classify(link, new Date()).kind, 'expired');
});
test('multi-segment slug: /juno/pitch-deck -> links/juno~pitch-deck, unauthenticated 200', async () => {
	const r = parseSlug('/juno/pitch-deck');
	assert.equal(r.slug, 'juno/pitch-deck');
	const res = await fetch(`${BASE}/links/${encodeURIComponent(slugToDocId(r.slug))}`);
	assert.equal(res.status, 200);
	assert.equal(decodeLink(await res.json()).url, 'https://example.com/deck');
});
test('missing link: 404', async () => {
	assert.equal((await fetch(`${BASE}/links/missing`)).status, 404);
});
test('unauthenticated collection list is denied', async () => {
	const r = await fetch(`${BASE}/links`);
	assert.equal(r.status, 403);
});
