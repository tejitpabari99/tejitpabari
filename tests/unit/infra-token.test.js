import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, statSync, mkdirSync, chmodSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('../../scripts/infra/token.mjs', import.meta.url).pathname;
const REFRESH = 'FIXTURE-REFRESH-TOKEN-do-not-print';
const ACCESS = 'ya29.fixture-access-token';

function run(args, env) {
	return new Promise((resolve) => {
		const p = spawn(process.execPath, [SCRIPT, ...args], { env: { PATH: process.env.PATH, ...env } });
		let out = '', err = '';
		p.stdout.on('data', (d) => (out += d));
		p.stderr.on('data', (d) => (err += d));
		p.on('close', (code) => resolve({ code, out, err }));
	});
}
function fixtureLogin(dir) {
	const f = join(dir, 'firebase-tools.json');
	writeFileSync(f, JSON.stringify({ tokens: { refresh_token: REFRESH } }));
	return f;
}
function tokenServer(status, body) {
	return new Promise((resolve) => {
		const s = createServer((req, res) => {
			let b = '';
			req.on('data', (d) => (b += d));
			req.on('end', () => {
				res.writeHead(status, { 'content-type': 'application/json' });
				// worst case: server echoes the request (incl. refresh token) back in the error
				res.end(JSON.stringify(status === 200 ? body : { error: 'invalid_grant', echo: b }));
			});
		});
		s.listen(0, '127.0.0.1', () => resolve({ s, url: `http://127.0.0.1:${s.address().port}/token` }));
	});
}

test('fails cleanly with no login file', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'tok-'));
	const r = await run([], { FIREBASE_LOGIN_FILE: join(dir, 'missing.json') });
	assert.notEqual(r.code, 0);
	assert.equal(r.out, '');
	assert.match(r.err, /firebase login/i);
});

test('prints only the access token, never the refresh token', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'tok-'));
	const { s, url } = await tokenServer(200, { access_token: ACCESS });
	const r = await run([], { FIREBASE_LOGIN_FILE: fixtureLogin(dir), TOKEN_ENDPOINT: url });
	s.close();
	assert.equal(r.code, 0);
	assert.equal(r.out, ACCESS + '\n');
	assert.ok(!r.out.includes(REFRESH) && !r.err.includes(REFRESH));
});

test('endpoint error: exits non-zero, no refresh token or echoed body leaked', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'tok-'));
	const { s, url } = await tokenServer(400);
	const r = await run([], { FIREBASE_LOGIN_FILE: fixtureLogin(dir), TOKEN_ENDPOINT: url });
	s.close();
	assert.notEqual(r.code, 0);
	assert.equal(r.out, '');
	assert.ok(!r.err.includes(REFRESH));
});

test('--adc writes authorized_user file mode 600 and prints no secrets', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'tok-'));
	const adc = join(dir, 'adc.json');
	const r = await run(['--adc', adc], { FIREBASE_LOGIN_FILE: fixtureLogin(dir) });
	assert.equal(r.code, 0);
	assert.ok(!r.out.includes(REFRESH) && !r.err.includes(REFRESH));
	const j = JSON.parse(readFileSync(adc, 'utf8'));
	assert.equal(j.type, 'authorized_user');
	assert.equal(j.refresh_token, REFRESH);
	assert.equal(statSync(adc).mode & 0o777, 0o600);
});

test('--adc locks dir to 0700 and overwrites a pre-existing 0644 file as 0600', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'tok-'));
	const home = join(dir, 'secrets');
	mkdirSync(home, { mode: 0o755 });
	chmodSync(home, 0o755);
	const adc = join(home, 'adc.json');
	writeFileSync(adc, 'old');
	chmodSync(adc, 0o644);
	const r = await run(['--adc', adc], { FIREBASE_LOGIN_FILE: fixtureLogin(dir) });
	assert.equal(r.code, 0);
	assert.equal(statSync(home).mode & 0o777, 0o700);
	assert.equal(statSync(adc).mode & 0o777, 0o600);
	assert.equal(JSON.parse(readFileSync(adc, 'utf8')).refresh_token, REFRESH);
	assert.deepEqual(readdirSync(home), ['adc.json']);
});
