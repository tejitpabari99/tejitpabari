import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ai from '../../admin/src/lib/ai.js';

test('final signatures (arity)', () => {
	assert.equal(ai.parseIdea.length, 1);
	assert.equal(ai.enhanceIdea.length, 2);
	assert.equal(ai.rankIdea.length, 2);
});
test('all three throw the stub error', async () => {
	await assert.rejects(async () => ai.parseIdea('x'), { message: 'AI is not configured yet' });
	await assert.rejects(async () => ai.enhanceIdea('a', 'b'), { message: 'AI is not configured yet' });
	await assert.rejects(async () => ai.rankIdea({ title: 't', brief: '', content: 'c' }, []), { message: 'AI is not configured yet' });
});
