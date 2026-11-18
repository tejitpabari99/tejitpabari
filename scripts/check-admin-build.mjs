#!/usr/bin/env node
// scripts/check-admin-build.mjs
//
// Guard for the production admin bundle (dist-admin/): it must exist
// (index.html present) and must not contain emulator hosts or an App Check
// debug-token assignment. Usage: node scripts/check-admin-build.mjs [dir]
// (dir defaults to dist-admin/ at the repo root).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const dir = path.resolve(process.argv[2] ?? path.join(ROOT, 'dist-admin'));

const PATTERNS = [
  { name: '127.0.0.1 (emulator host)', re: /127\.0\.0\.1/ },
  { name: 'localhost:9099 (auth emulator)', re: /localhost:9099/ },
  { name: 'localhost:8080 (firestore emulator)', re: /localhost:8080/ },
  { name: 'FIREBASE_APPCHECK_DEBUG_TOKEN assignment', re: /FIREBASE_APPCHECK_DEBUG_TOKEN\s*=(?!=)/ },
];

function walk(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

if (!existsSync(path.join(dir, 'index.html'))) {
  console.error(`check:admin-build FAILED: ${path.join(dir, 'index.html')} is missing (run build:admin first).`);
  process.exit(1);
}

const failures = [];
for (const file of walk(dir)) {
  const text = readFileSync(file, 'utf8');
  for (const p of PATTERNS) {
    if (p.re.test(text)) failures.push(`${path.relative(dir, file).split(path.sep).join('/')}: ${p.name}`);
  }
}

if (failures.length > 0) {
  console.error('check:admin-build FAILED:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('check:admin-build OK');
