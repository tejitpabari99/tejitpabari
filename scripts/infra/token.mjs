#!/usr/bin/env node
// Mint a short-lived Google OAuth access token from the firebase-tools login.
// Usage:  node scripts/infra/token.mjs            -> prints ONLY the access token
//         node scripts/infra/token.mjs --adc [file] -> writes authorized_user ADC file (mode 600,
//                                                      default ~/.secrets/adc-owner.json), prints its path
// Never prints the refresh token. Env overrides (tests): FIREBASE_LOGIN_FILE, TOKEN_ENDPOINT.
import { readFileSync, writeFileSync, mkdirSync, chmodSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

// firebase-tools' own public OAuth client (installed-app credentials, published in its source).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const fail = (msg) => {
	process.stderr.write(`token.mjs: ${msg}\n`);
	process.exit(1);
};

const loginFile = process.env.FIREBASE_LOGIN_FILE || join(homedir(), '.config/configstore/firebase-tools.json');
let refresh;
try {
	refresh = JSON.parse(readFileSync(loginFile, 'utf8'))?.tokens?.refresh_token;
} catch {
	fail(`cannot read firebase-tools login file (${loginFile}); run \`npx firebase login\``);
}
if (!refresh) fail('no refresh token in login file; run `npx firebase login`');

const args = process.argv.slice(2);
const adcIdx = args.indexOf('--adc');
if (adcIdx !== -1) {
	const out = args[adcIdx + 1] || join(homedir(), '.secrets/adc-owner.json');
	const dir = dirname(out);
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	chmodSync(dir, 0o700);
	// temp file (0600) + rename: an overwrite never exposes the token at an old file's permissions
	const tmp = `${out}.${process.pid}.tmp`;
	writeFileSync(tmp, JSON.stringify({ type: 'authorized_user', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refresh }), { mode: 0o600 });
	chmodSync(tmp, 0o600);
	renameSync(tmp, out);
	process.stdout.write(out + '\n');
} else {
	const endpoint = process.env.TOKEN_ENDPOINT || 'https://oauth2.googleapis.com/token';
	let res;
	try {
		res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' })
		});
	} catch {
		fail('token endpoint unreachable');
	}
	let body = {};
	try {
		body = await res.json();
	} catch {}
	if (!res.ok || !body.access_token) fail(`token endpoint refused (HTTP ${res.status}${typeof body.error === 'string' ? ', ' + body.error : ''}); re-run \`npx firebase login\``);
	process.stdout.write(body.access_token + '\n');
}
