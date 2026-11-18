import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ai from '../../admin/src/lib/ai.js';

test('final signatures (arity)', () => {
	assert.equal(ai.parseIdea.length, 1);
	assert.equal(ai.enhanceIdea.length, 2);
	assert.equal(ai.rankIdea.length, 2);
});
