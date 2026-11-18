import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setup, teardown } from './helpers.js';
import {
	__setDb, listIdeas, getIdea, createIdea, saveIdeaMeta, saveIdeaContent, deleteIdea,
	setRanking, resetRanking, resetAllRankings, slugifyTitle, renderMarkdown, computeScore
} from '../../admin/src/lib/ideas.js';

let env, db;
before(async () => {
	({ env, db } = await setup());
	__setDb(db);
});
after(() => teardown({ env, db }));
beforeEach(() => env.clearFirestore());

const raw = async (slug) => (await getDoc(doc(db, 'ideas', slug))).data();
const put = (slug, d) => setDoc(doc(db, 'ideas', slug), d);
const today = new Date().toISOString().split('T')[0];

test('slugifyTitle', () => {
	assert.equal(slugifyTitle('Hello, World! Foo-Bar'), 'hello-world-foo-bar');
	assert.equal(slugifyTitle('a'.repeat(80)).length, 60);
});
test('renderMarkdown', () => assert.match(renderMarkdown('# Hi'), /<h1[^>]*>Hi<\/h1>/));
test('computeScore (invert, weights, null cases)', () => {
	const cr = [{ id: 'a', weight: 1, invert: false }, { id: 'b', weight: 2, invert: true }];
	assert.equal(computeScore({ a: 5, b: 1 }, cr), 100);
	assert.equal(computeScore({}, cr), 0);
	assert.equal(computeScore({}, []), null);
	assert.equal(computeScore({ a: 3 }, undefined), null);
});

test('create -> get round trip', async () => {
	const slug = await createIdea({ title: 'My Idea', content: '## Overview\n\nBody', tags: ['ai tools', 'web'], brief: 'b' });
	assert.equal(slug, 'my-idea');
	const d = await raw(slug);
	assert.equal(d.date, today);
	assert.equal(d.status, 'new');
	assert.equal(d.link, '');
	assert.equal(d.ranked, false);
	const i = await getIdea(slug);
	assert.equal(i.slug, 'my-idea');
	assert.deepEqual(i.tags, ['Ai Tools', 'Web']);
	assert.equal(i.content, '## Overview\n\nBody');
	assert.match(i.html, /<h2[^>]*>Overview<\/h2>/);
	assert.equal(i.date, today);
	assert.equal(await getIdea('nope'), null);
});
test('create: collision suffix and reserved slug', async () => {
	assert.equal(await createIdea({ title: 'Dup', content: 'x' }), 'dup');
	assert.equal(await createIdea({ title: 'Dup', content: 'y' }), 'dup-2');
	assert.equal(await createIdea({ title: 'Dup', content: 'z' }), 'dup-3');
	assert.equal((await raw('dup')).body, 'x');
	await assert.rejects(createIdea({ title: 'Rank', content: 'x' }), /reserved/);
	await assert.rejects(createIdea({ title: '!!!', content: 'x' }), /Invalid title/);
});
test('listIdeas: excerpt, titlecased tags, defaults, sort', async () => {
	await put('old', { title: 'Old', date: '2026-01-01', tags: ['x y'], body: '# H\n\nline one\nline two ' + 'z'.repeat(200) });
	await put('new', { title: 'New', date: '2026-05-01', body: 'b' });
	await put('nodate-b', { title: 'B', body: '' });
	await put('nodate-a', { title: 'A', body: '' });
	const l = await listIdeas();
	assert.deepEqual(l.map((i) => i.slug), ['new', 'old', 'nodate-a', 'nodate-b']);
	const o = l[1];
	assert.deepEqual(o.tags, ['X Y']);
	assert.equal(o.excerpt.length, 150);
	assert.ok(o.excerpt.startsWith('line one line two'));
	assert.equal(o.status, 'new');
	assert.deepEqual(o.scores, {});
	assert.equal(o.ranked, false);
	assert.equal(o.body, undefined);
});
test('saveIdeaMeta partial update; missing doc throws', async () => {
	await put('a', { title: 'A', status: 'new', tags: [], body: 'keep' });
	await saveIdeaMeta('a', { status: 'done', tags: ['foo bar'], link: 'l', title: 'T', github: 'g', brief: 'br' });
	const d = await raw('a');
	assert.deepEqual([d.status, d.tags, d.link, d.title, d.github, d.brief, d.body], ['done', ['Foo Bar'], 'l', 'T', 'g', 'br', 'keep']);
	await assert.rejects(saveIdeaMeta('zzz', { status: 'x' }));
});
test('saveIdeaContent merges meta, creates if missing, replaces scores', async () => {
	await put('a', { title: 'A', status: 'new', scores: { x: 1, y: 2 }, body: 'old' });
	await saveIdeaContent('a', 'new body', { scores: { z: 3 }, ranked: true });
	const d = await raw('a');
	assert.equal(d.body, 'new body');
	assert.equal(d.title, 'A');
	assert.deepEqual(d.scores, { z: 3 });
	await saveIdeaContent('fresh', 'c', { title: 'F' });
	assert.equal((await raw('fresh')).body, 'c');
});
test('deleteIdea', async () => {
	await put('a', { title: 'A' });
	await deleteIdea('a');
	assert.equal(await getIdea('a'), null);
});
const SEC = '## Ranking Analysis (Auto-rank)';
test('setRanking appends analysis section, replaces existing, validates', async () => {
	await put('a', { title: 'A', body: 'Body text\n' });
	await setRanking('a', { scores: { f: 4 }, analysis: ' why ' });
	let d = await raw('a');
	assert.equal(d.body, `Body text\n\n${SEC}\n\nwhy`);
	assert.equal(d.ranked, true);
	assert.deepEqual(d.scores, { f: 4 });
	await setRanking('a', { scores: { f: 2 }, analysis: 'again' });
	d = await raw('a');
	assert.equal(d.body, `Body text\n\n${SEC}\n\nagain`);
	await setRanking('a', { scores: { f: 5 } }); // no analysis -> body untouched
	d = await raw('a');
	assert.equal(d.body, `Body text\n\n${SEC}\n\nagain`);
	assert.deepEqual(d.scores, { f: 5 });
	await assert.rejects(setRanking('a', { scores: { f: 9 } }), { message: 'Invalid score value' });
	await assert.rejects(setRanking('nope', { scores: { f: 1 } }));
});
test('resetRanking strips section, clears scores; no-section keeps body', async () => {
	await put('a', { title: 'A', ranked: true, scores: { f: 4 }, body: `Body\n\n${SEC}\n\nwhy\n\n## More` });
	await resetRanking('a');
	let d = await raw('a');
	assert.equal(d.body, 'Body');
	assert.equal(d.ranked, false);
	assert.deepEqual(d.scores, {});
	await put('b', { title: 'B', ranked: true, scores: { f: 1 }, body: 'plain  \n' });
	await resetRanking('b');
	d = await raw('b');
	assert.equal(d.body, 'plain  \n');
	assert.equal(d.ranked, false);
});
test('resetAllRankings batch', async () => {
	await put('a', { title: 'A', ranked: true, scores: { f: 4 }, body: `x\n\n${SEC}\n\ny` });
	await put('b', { title: 'B', ranked: true, scores: { f: 4 }, body: 'y' });
	await put('c', { title: 'C', ranked: true, scores: { f: 4 }, body: 'y' });
	await resetAllRankings(['a', 'b']);
	assert.deepEqual([(await raw('a')).body, (await raw('a')).ranked, (await raw('b')).ranked, (await raw('c')).ranked], ['x', false, false, true]);
	await resetAllRankings([]);
});
