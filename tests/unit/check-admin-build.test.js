// check-admin-build: dirty dist-admin fixtures fail naming the file; clean passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SCRIPT = path.resolve(import.meta.dirname, '../../scripts/check-admin-build.mjs');

function run(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'admin-build-'));
  try {
    for (const [rel, body] of Object.entries(files)) {
      const f = path.join(dir, rel);
      mkdirSync(path.dirname(f), { recursive: true });
      writeFileSync(f, body);
    }
    return spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const HTML = '<!doctype html><title>admin</title>';

test('clean build passes', () => {
  const r = run({ 'index.html': HTML, 'assets/app.js': 'console.log("ok")' });
  assert.equal(r.status, 0, r.stderr);
});

test('missing index.html fails', () => {
  const r = run({ 'assets/app.js': 'x' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /index\.html/);
});

for (const [name, needle] of [
  ['127.0.0.1', 'connect("127.0.0.1:9099")'],
  ['localhost:9099', 'http://localhost:9099'],
  ['localhost:8080', 'host:"localhost:8080"'],
  ['debug token assignment', 'self.FIREBASE_APPCHECK_DEBUG_TOKEN = "abc"'],
]) {
  test(`dirty build (${name}) fails naming the file`, () => {
    const r = run({ 'index.html': HTML, 'assets/index-abc.js': needle });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /assets\/index-abc\.js/);
  });
}
