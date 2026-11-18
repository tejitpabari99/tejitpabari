import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
	transformIdea,
	transformLink,
	transformSettings,
	validateIdeas,
	validateLinks,
	validateSettings,
	DEFAULT_CRITERIA
} from '../../scripts/lib/migrate-transform.js';

const goodIdea = (over = {}) => ({
	id: 'a-b',
	doc: {
		date: '2026-01-02',
		title: 'T',
		status: 'new',
		tags: ['X'],
		link: '',
		ranked: true,
		scores: { interest: 3 },
		github: '',
		brief: '',
		body: 'hi',
		...over
	}
});
const goodLink = (id = 'meet', over = {}) => ({
	id,
	doc: { slug: id, url: 'https://x.io', tags: ['A'], description: '', created: '2026-01-01', expiresAt: null, ...over }
});
const msgs = (r) => r.errors.join('\n');

describe('transformIdea', () => {
	test('Date date -> YYYY-MM-DD; body verbatim; tags title-cased', () => {
		const { doc } = transformIdea('s', { date: new Date('2026-03-05T00:00:00Z'), title: 'T', tags: ['foo bar', 'baz'] }, '\nbody\n## Ranking Analysis\n');
		assert.equal(doc.date, '2026-03-05');
		assert.deepEqual(doc.tags, ['Foo Bar', 'Baz']);
		assert.equal(doc.body, '\nbody\n## Ranking Analysis\n');
	});
	test('string date kept as first 10 chars', () => {
		assert.equal(transformIdea('s', { date: '2026-03-29' }, '').doc.date, '2026-03-29');
	});
	test('defaults for missing fields; title defaults to slug', () => {
		const { doc } = transformIdea('my-slug', { date: '2026-01-01' }, 'b');
		assert.deepEqual(doc, {
			date: '2026-01-01', title: 'my-slug', status: 'new', tags: [], link: '', ranked: false,
			scores: {}, github: '', brief: '', body: 'b'
		});
	});
	test('unknown keys dropped with warning', () => {
		const { doc, warnings } = transformIdea('s', { date: '2026-01-01', foo: 1 }, '');
		assert.equal('foo' in doc, false);
		assert.ok(warnings.some((w) => w.includes('foo')));
	});
	test('bad types preserved for validator', () => {
		const { doc } = transformIdea('s', { date: '2026-01-01', tags: 'nope', scores: 'x' }, '');
		assert.equal(doc.tags, 'nope');
		assert.equal(doc.scores, 'x');
	});
});

describe('transformLink', () => {
	test('lowercases id, drops fields, defaults description', () => {
		const { id, doc } = transformLink({
			slug: 'Meet', url: 'https://x.io', tags: ['a b'], created: '2026-01-01',
			clicks: 5, lastClicked: 'x', redirectType: '302'
		});
		assert.equal(id, 'meet');
		assert.deepEqual(doc, { slug: 'meet', url: 'https://x.io', tags: ['A B'], description: '', created: '2026-01-01', expiresAt: null });
	});
	test('multi-segment: id has ~, slug field keeps /', () => {
		const { id, doc } = transformLink({ slug: 'juno/pitch-deck', url: 'https://x.io', created: '2026-01-01' });
		assert.equal(id, 'juno~pitch-deck');
		assert.equal(doc.slug, 'juno/pitch-deck');
	});
	test('missing created is left undefined (validator errors)', () => {
		const { doc } = transformLink({ slug: 'a', url: 'https://x.io', tags: [] });
		assert.equal(doc.created, undefined);
	});
});

describe('transformSettings', () => {
	test('coerces weight/invert', () => {
		const d = transformSettings({
			guestVisibility: { '/': true, '/ideas': true, '/links': false },
			ranker: { criteria: [{ id: 'a', label: 'A', weight: '3', invert: 1 }, { id: 'b', label: 'B', weight: 0, invert: 0 }] }
		});
		assert.deepEqual(d.ranker.criteria, [
			{ id: 'a', label: 'A', weight: 3, invert: true },
			{ id: 'b', label: 'B', weight: 1, invert: false }
		]);
	});
	test('missing ranker -> default criteria', () => {
		const d = transformSettings({ guestVisibility: { '/': true, '/ideas': true, '/links': true } });
		assert.deepEqual(d.ranker.criteria, DEFAULT_CRITERIA);
		assert.equal(DEFAULT_CRITERIA.length, 6);
	});
});

describe('validateIdeas', () => {
	test('valid passes', () => {
		const r = validateIdeas([goodIdea()], 1);
		assert.deepEqual(r.errors, []);
	});
	test('slug with / is error', () => {
		assert.match(msgs(validateIdeas([{ ...goodIdea(), id: 'a/b' }], 1)), /a\/b/);
	});
	test('reserved slug "rank" is an error', () => {
		assert.match(msgs(validateIdeas([{ ...goodIdea(), id: 'rank' }], 1)), /rank.*reserved/i);
	});
	for (const id of ['.', '..', '__x__', '', 'Upper', 'a_b', 'a'.repeat(1501)]) {
		test(`bad slug ${id.slice(0, 10)}`, () => {
			assert.ok(validateIdeas([{ ...goodIdea(), id }], 1).errors.length > 0);
		});
	}
	test('duplicate slugs', () => {
		assert.match(msgs(validateIdeas([goodIdea(), goodIdea()], 2)), /duplicate/i);
	});
	test('bad types', () => {
		for (const over of [{ tags: 'x' }, { tags: [1] }, { scores: { a: 'x' } }, { scores: [] }, { date: '03/01/2026' }, { date: '' }, { title: 5 }, { ranked: 'yes' }, { body: 5 }]) {
			assert.ok(validateIdeas([goodIdea(over)], 1).errors.length > 0, JSON.stringify(over));
		}
	});
	test('score out of range is warning only', () => {
		const r = validateIdeas([goodIdea({ scores: { interest: 9 } })], 1);
		assert.deepEqual(r.errors, []);
		assert.ok(r.warnings.length > 0);
	});
	test('ranked/scores mismatch are warnings', () => {
		assert.ok(validateIdeas([goodIdea({ ranked: true, scores: {} })], 1).warnings.length > 0);
		assert.ok(validateIdeas([goodIdea({ ranked: false, scores: { a: 1 } })], 1).warnings.length > 0);
	});
	test('body > 900KB is error', () => {
		assert.ok(validateIdeas([goodIdea({ body: 'x'.repeat(900 * 1024 + 1) })], 1).errors.length > 0);
	});
	test('count mismatch is error', () => {
		assert.match(msgs(validateIdeas([goodIdea()], 2)), /count/i);
	});
});

describe('validateLinks', () => {
	test('valid passes', () => assert.deepEqual(validateLinks([goodLink()], 1).errors, []));
	test('multi-segment slug is valid (id = docId, slug = real form)', () => {
		const e = transformLink({ slug: 'Juno/Pitch-Deck', url: 'https://x.io', created: '2026-01-01' });
		assert.equal(e.id, 'juno~pitch-deck');
		assert.equal(e.doc.slug, 'juno/pitch-deck');
		assert.deepEqual(validateLinks([e], 1).errors, []);
	});
	for (const slug of ['a_b', 'a//b', '/a', 'a/', 'a/~b', 'a~b', '', 'a/B_']) {
		test(`bad link slug ${JSON.stringify(slug)}`, () => {
			assert.ok(validateLinks([transformLink({ slug, url: 'https://x.io', created: '2026-01-01' })], 1).errors.length > 0);
		});
	}
	test('link doc id must equal slugToDocId(slug)', () => {
		assert.ok(validateLinks([goodLink('x~y', { slug: 'x/z' })], 1).errors.length > 0);
	});
	test('multi-segment duplicates case-insensitive', () => {
		const a = transformLink({ slug: 'Juno/Pitch', url: 'https://x.io', created: '2026-01-01' });
		const b = transformLink({ slug: 'juno/pitch', url: 'https://x.io', created: '2026-01-01' });
		assert.match(msgs(validateLinks([a, b], 2)), /duplicate/i);
	});
	test('duplicates case-insensitive (ids compared lowercase)', () => {
		const a = transformLink({ slug: 'Meet', url: 'https://x.io', created: '2026-01-01' });
		const b = transformLink({ slug: 'meet', url: 'https://x.io', created: '2026-01-01' });
		assert.match(msgs(validateLinks([a, b], 2)), /duplicate/i);
	});
	test('missing created / bad url / bad tags / bad expiresAt', () => {
		for (const over of [{ created: undefined }, { url: 'ftp://x' }, { url: 'javascript:alert(1)' }, { tags: 'x' }, { expiresAt: 5 }, { description: 3 }]) {
			assert.ok(validateLinks([goodLink('meet', over)], 1).errors.length > 0, JSON.stringify(over));
		}
	});
});

describe('validateSettings', () => {
	const ok = () => transformSettings({ guestVisibility: { '/': true, '/ideas': true, '/links': true } });
	test('valid passes', () => assert.deepEqual(validateSettings(ok()).errors, []));
	test('missing toggle / non-bool', () => {
		const d = ok();
		delete d.guestVisibility['/links'];
		assert.ok(validateSettings(d).errors.length > 0);
		const e = ok();
		e.guestVisibility['/'] = 'yes';
		assert.ok(validateSettings(e).errors.length > 0);
	});
	test('bad criteria', () => {
		const d = ok();
		d.ranker.criteria[0].weight = 1.5;
		assert.ok(validateSettings(d).errors.length > 0);
	});
});
