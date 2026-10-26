// scripts/check-no-forms.test.ts
//
// Round 3.1 (/live subsystem restoration): src/pages/live/ exists again on
// disk (registry.ts, see that file), so this file's "real repo" case now
// exercises check-no-forms.sh's main grep-based guard directly, instead of
// the `[ ! -d src/pages/live ]` early-exit branch it exercised while the
// directory was gone (round 3's r3-01-schema-icons-content). That
// early-exit branch is kept in the script (harmless, for a future
// hypothetical where src/pages/live/ is removed again) and still gets its
// own coverage below, via a temporary rename of the real directory rather
// than deleting it — this repo's real src/pages/live/registry.ts must
// never be at risk of being wiped out by a test run, even mid-failure.
//
// This file intentionally lives under `scripts/`, not `src/`, and — like
// scripts/check-launch-content.test.ts (SP02 Task 10/15) before it — is
// excluded from vitest's default test discovery via `test.exclude` in
// vite.config.ts (`scripts/**`), so `npm test` (`vitest run` with no path
// argument) does not pick it up and its suite/test counts stay unaffected.
// Because Vitest applies `exclude` before a CLI path argument filters
// anything, run this file with the same lever `check:launch` uses to lift
// the `scripts/**` exclusion for one invocation:
// `CHECK_LAUNCH=1 npx vitest run scripts/check-no-forms.test.ts`.
import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const LIVE_DIR = path.join(REPO_ROOT, 'src', 'pages', 'live');
const FIXTURE_FILE = path.join(LIVE_DIR, '__check-no-forms-test-fixture__.tsx');

function runScript(): { status: number; output: string } {
  try {
    const output = execFileSync('bash', ['scripts/check-no-forms.sh'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output };
  } catch (err) {
    const e = err as { status: number | null; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('check-no-forms.sh', () => {
  // Backstop cleanup: even if an assertion below throws mid-test, the real
  // repo must never end up with a leftover fixture file breaking a later
  // `check:no-forms` run. Only ever removes this one fixture file — never
  // the directory itself, which now holds the real registry.ts.
  afterEach(() => {
    if (existsSync(FIXTURE_FILE)) {
      rmSync(FIXTURE_FILE, { force: true });
    }
  });

  it('exits 0 against the real repo, where src/pages/live/ exists but has no input-accepting markup', () => {
    expect(existsSync(LIVE_DIR)).toBe(true);
    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('check:no-forms passed');
    expect(output).toContain('no input-accepting markup');
  });

  it('exits nonzero and names the offending file when a bare <input> is added under src/pages/live/', () => {
    writeFileSync(FIXTURE_FILE, `export function CheckNoFormsTestFixture() {\n  return <input type="text" />;\n}\n`);

    const result = runScript();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
    expect(result.output).toContain('__check-no-forms-test-fixture__.tsx');
  });

  it('exits nonzero for a bare self-closing tag ("<input/>", no space before "/") under src/pages/live/', () => {
    writeFileSync(FIXTURE_FILE, `export function CheckNoFormsTestFixture() {\n  return <input/>;\n}\n`);

    const result = runScript();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
  });

  it('is clean again immediately after the offending fixture file is removed', () => {
    writeFileSync(FIXTURE_FILE, `export function CheckNoFormsTestFixture() {\n  return <input/>;\n}\n`);
    rmSync(FIXTURE_FILE, { force: true });

    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('no input-accepting markup');
  });

  it('exits 0 via the early-exit branch when src/pages/live/ does not exist at all', () => {
    // Temporarily rename the real directory out of the way rather than
    // deleting it — registry.ts must survive this test even if an
    // assertion below throws mid-test.
    const backupDir = `${LIVE_DIR}.check-no-forms-test-backup`;
    renameSync(LIVE_DIR, backupDir);
    try {
      const { status, output } = runScript();
      expect(status).toBe(0);
      expect(output).toContain('does not exist');
    } finally {
      renameSync(backupDir, LIVE_DIR);
    }
  });
});
