import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLUG_RE, isValidSlug, slugToDocId, docIdToSlug } from '../../admin/src/lib/slug.js';

test('isValidSlug: valid', () => {
	for (const s of ['meet', 'a-1', 'juno/pitch-deck', 'juno/founder/fred', '0/9']) assert.ok(isValidSlug(s), s);
});
test('isValidSlug: invalid', () => {
	for (const s of ['', '/', 'a/', '/a', 'a//b', 'a/~b', 'a~b', 'a_b', 'A/b', 'a b', 'a.b', 'a/b/', null, undefined, 5])
		assert.equal(isValidSlug(s), false, String(s));
});
test('SLUG_RE is the documented regex', () => {
	assert.equal(SLUG_RE.source, '^[a-z0-9-]+(\\/[a-z0-9-]+)*$');
});
test('slugToDocId / docIdToSlug', () => {
	assert.equal(slugToDocId('juno/pitch-deck'), 'juno~pitch-deck');
	assert.equal(slugToDocId('juno/founder/fred'), 'juno~founder~fred');
	assert.equal(slugToDocId('meet'), 'meet');
	assert.equal(docIdToSlug('juno~pitch-deck'), 'juno/pitch-deck');
	assert.equal(docIdToSlug('meet'), 'meet');
});
test('mapping round-trips for valid slugs', () => {
	for (const s of ['a', 'a/b', 'a/b/c-d']) assert.equal(docIdToSlug(slugToDocId(s)), s);
});

test('IDEA_SLUG_RE / isValidIdeaSlug: single segment [a-z0-9-]+', async () => {
	const { IDEA_SLUG_RE, isValidIdeaSlug } = await import('../../admin/src/lib/slug.js');
	assert.equal(IDEA_SLUG_RE.source, '^[a-z0-9-]+$');
	for (const s of ['a', 'a-1', 'rank']) assert.ok(isValidIdeaSlug(s), s);
	for (const s of ['', 'a/b', 'A', 'a_b', null, 5]) assert.equal(isValidIdeaSlug(s), false, String(s));
});
