import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	parseSchemaDescriptor, rankSchemaDescriptor, buildSchema,
	validateParse, validateEnhance, validateRank, MalformedOutputError
} from '../../admin/src/lib/ai-shape.js';
import { toUserMessage } from '../../admin/src/lib/ai-errors.js';

const criteria = [
	{ id: 'a', label: 'A', weight: 1, invert: false },
	{ id: 'b', label: 'B', weight: 1, invert: true },
	{ id: 'interest', label: 'I', weight: 1, invert: false }
];

test('validateParse: valid, tags filtered to list and capped at 3', () => {
	const out = validateParse({ title: ' T ', content: 'C', tags: ['AI', 'bogus', 'web', 'tools', 'food'], brief: 'B' });
	assert.deepEqual(out, { title: 'T', content: 'C', tags: ['AI', 'web', 'tools'], brief: 'B' });
});
test('validateParse: accepts JSON string, strips fences', () => {
	const out = validateParse('```json\n{"title":"T","content":"C","tags":[],"brief":"B"}\n```');
	assert.equal(out.title, 'T');
});
test('validateParse: rejects empty title/content and bad JSON', () => {
	assert.throws(() => validateParse({ title: ' ', content: 'C', tags: [], brief: '' }), MalformedOutputError);
	assert.throws(() => validateParse({ title: 'T', content: '', tags: [], brief: '' }), MalformedOutputError);
	assert.throws(() => validateParse('not json'), MalformedOutputError);
});
test('validateParse: non-string brief becomes empty', () => {
	assert.equal(validateParse({ title: 'T', content: 'C', tags: [], brief: 5 }).brief, '');
});

test('validateEnhance: trim, unfence, reject empty', () => {
	assert.deepEqual(validateEnhance('  ```markdown\n# Hi\n```  '), { content: '# Hi' });
	assert.deepEqual(validateEnhance('plain'), { content: 'plain' });
	assert.throws(() => validateEnhance('  '), MalformedOutputError);
	assert.throws(() => validateEnhance('```\n```'), MalformedOutputError);
});

test('validateRank: clamp 4.7/abc/9/0 -> 4/3/5/1, missing id -> 3, interest ignored', () => {
	const r = validateRank({ scores: { a: '4.7', b: 'abc', interest: 5 }, analysis: 'ok' }, criteria);
	assert.deepEqual(r, { scores: { a: 4, b: 3 }, analysis: 'ok' });
	const c3 = [{ id: 'w' }, { id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'm' }];
	const r2 = validateRank({ scores: { w: 4.7, x: 'abc', y: 9, z: 0 }, analysis: 'x' }, c3);
	assert.deepEqual(r2.scores, { w: 4, x: 3, y: 5, z: 1, m: 3 });
});
test('validateRank: non-object scores rejected, analysis defaults to string', () => {
	assert.throws(() => validateRank({ analysis: 'x' }, criteria), MalformedOutputError);
	assert.equal(validateRank({ scores: { a: 1, b: 1 } }, criteria).analysis, '');
});

test('schema descriptors: interest never present, all required', () => {
	const d = rankSchemaDescriptor(criteria);
	assert.deepEqual(Object.keys(d.properties.scores.properties), ['a', 'b']);
	assert.ok(!JSON.stringify(d).includes('interest'));
	assert.deepEqual(d.properties.scores.required, ['a', 'b']);
	assert.deepEqual(Object.keys(parseSchemaDescriptor().properties), ['title', 'content', 'tags', 'brief']);
});
test('buildSchema uses injected Schema', () => {
	const S = {
		object: (o) => ({ o }), string: () => 's', integer: () => 'i', array: (a) => ({ arr: a })
	};
	const s = buildSchema(S, rankSchemaDescriptor(criteria));
	assert.equal(s.o.properties.analysis, 's');
	assert.equal(s.o.properties.scores.o.properties.a, 'i');
	const p = buildSchema(S, parseSchemaDescriptor());
	assert.deepEqual(p.o.properties.tags, { arr: { items: 's' } });
});

test('toUserMessage: status/code first, message second', () => {
	const mk = (code, status, message = 'x') => Object.assign(new Error(message), { code, customErrorData: status ? { status } : undefined });
	assert.match(toUserMessage(mk('fetch-error', 403, 'Firebase App Check token is invalid')), /App Check blocked/);
	assert.match(toUserMessage(mk('fetch-error', 403, 'The API key restriction')), /App Check blocked/);
	assert.match(toUserMessage(mk('fetch-error', 429)), /quota reached/);
	assert.match(toUserMessage(mk('fetch-error', 404)), /AI model or AI Logic not set up/);
	assert.match(toUserMessage(mk('api-not-enabled')), /AI model or AI Logic not set up/);
	assert.match(toUserMessage(mk('response-error', undefined, 'Response was blocked due to SAFETY')), /declined/);
	assert.match(toUserMessage(new MalformedOutputError('bad')), /malformed output/);
	assert.match(toUserMessage(mk('parse-failed')), /malformed output/);
	assert.match(toUserMessage(Object.assign(new Error('nope'), { status: 429 })), /quota reached/);
	assert.match(toUserMessage(new Error('Admin only')), /Admin only/);
	assert.equal(toUserMessage(new Error('boom'), { log: () => {} }), 'AI request failed');
	assert.equal(toUserMessage(null, { log: () => {} }), 'AI request failed');
});
test('toUserMessage: status beats message', () => {
	const e = Object.assign(new Error('quota exceeded safety'), { customErrorData: { status: 404 } });
	assert.match(toUserMessage(e), /not set up/);
});
