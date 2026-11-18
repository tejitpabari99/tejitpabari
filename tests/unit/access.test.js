import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canView } from '../../admin/src/lib/access.js';

const gv = { '/': true, '/ideas': true, '/links': false };

test('admin sees everything', () => {
	for (const p of ['/', '/ideas', '/links', '/settings', '/ideas/rank', '/nope'])
		assert.equal(canView(p, 'admin', {}), true);
});
test('guest: visible exact and prefix-plus-slash', () => {
	assert.equal(canView('/ideas', 'guest', gv), true);
	assert.equal(canView('/ideas/foo', 'guest', gv), true);
	assert.equal(canView('/', 'guest', gv), true);
});
test('guest: "/" matches only "/"', () => {
	assert.equal(canView('/links', 'guest', { '/': true }), false);
	assert.equal(canView('/ideas', 'guest', { '/': true }), false);
});
test('guest: hidden / false / empty / missing map', () => {
	assert.equal(canView('/links', 'guest', gv), false);
	assert.equal(canView('/links/x', 'guest', gv), false);
	assert.equal(canView('/ideas', 'guest', {}), false);
	assert.equal(canView('/ideas', 'guest', undefined), false);
	assert.equal(canView('/ideasx', 'guest', gv), false);
});
test('guest: admin-only paths denied even if toggled', () => {
	const all = { '/': true, '/ideas': true, '/settings': true, '/ideas/rank': true };
	assert.equal(canView('/settings', 'guest', all), false);
	assert.equal(canView('/ideas/rank', 'guest', all), false);
	assert.equal(canView('/settings/x', 'guest', all), false);
	assert.equal(canView('/ideas/ranking', 'guest', all), true);
});
test('/login always viewable (hooks PUBLIC_PATHS)', () => {
	assert.equal(canView('/login', 'guest', {}), true);
});
