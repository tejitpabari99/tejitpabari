// scripts/check-no-forms.test.ts
//
// Task 25 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// a small shell-invocation test for scripts/check-no-forms.sh (Task 15),
// per PRD §7's "a small shell-invocation test... acceptable given the
// script's own small surface".
//
// This file intentionally lives under `scripts/`, not `src/`, and — like
// scripts/check-launch-content.test.ts (SP02 Task 10/15) before it — is
// excluded from vitest's default test discovery via `test.exclude` in
// vite.config.ts (`scripts/**`), so `npm test` (`vitest run` with no path
// argument) does not pick it up and its suite/test counts stay unaffected.
// Because Vitest applies `exclude` before a CLI path argument filters
// anything, a bare `npx vitest run scripts/check-no-forms.test.ts` finds
// zero test files. Run it with the same lever `check:launch` uses to lift
// the `scripts/**` exclusion for one invocation:
// `CHECK_LAUNCH=1 npx vitest run scripts/check-no-forms.test.ts`.
//
// check-no-forms.sh's target path (`src/pages/live`) is hardcoded, not
// parameterized (Task 15, unchanged here) — so unlike a fixture-temp-dir
// test, this test's simplest reliable form is to exercise the script
// against the REAL src/pages/live/ directory: (a) confirm it exits 0
// today against that real, clean directory, and (b) reproduce the exact
// manual steps from Task 15's acceptance criterion 3 programmatically —
// write a temp file with a bare <input> into the real src/pages/live/,
// assert nonzero exit and the file's name in the output, then delete the
// temp file in a finally/afterEach regardless of test outcome, so a
// failed assertion never leaves the fixture behind to break every
// subsequent `check:no-forms` run.
import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
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
  // Backstop cleanup: even if an assertion below throws mid-test, the
  // fixture file must never survive to break a later `check:no-forms` run
  // (this test's own acceptance criterion, and TASKS.md's own explicit
  // "zero stray files" requirement).
  afterEach(() => {
    if (existsSync(FIXTURE_FILE)) {
      rmSync(FIXTURE_FILE);
    }
  });

  it('exits 0 against the real, clean src/pages/live/ directory today', () => {
    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('check:no-forms passed');
  });

  it('exits nonzero and names the offending file when a bare <input> is added under src/pages/live/', () => {
    writeFileSync(
      FIXTURE_FILE,
      `export function CheckNoFormsTestFixture() {\n  return <input type="text" />;\n}\n`,
    );

    let result: { status: number; output: string };
    try {
      result = runScript();
    } finally {
      rmSync(FIXTURE_FILE);
    }

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
    expect(result.output).toContain('__check-no-forms-test-fixture__.tsx');
  });

  it('is clean again (exits 0) immediately after the fixture file is removed', () => {
    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('check:no-forms passed');
    expect(existsSync(FIXTURE_FILE)).toBe(false);
  });

  // Security regression (verified finding): the original pattern
  // `<(input|form|textarea)[ >]` required a space or ">" immediately after
  // the tag name, and grep matched line-by-line — so it missed both a bare
  // self-closing tag (no space before "/") and a Prettier-wrapped
  // multi-line tag (nothing follows "input" on its own line). This check
  // backs a factual "no forms on this site" claim in /privacy and /terms,
  // so a silent bypass here makes shipped legal copy false.
  it('exits nonzero and names the file for a bare self-closing tag ("<input/>", no space before "/")', () => {
    writeFileSync(
      FIXTURE_FILE,
      `export function CheckNoFormsTestFixture() {\n  return <input/>;\n}\n`,
    );

    let result: { status: number; output: string };
    try {
      result = runScript();
    } finally {
      rmSync(FIXTURE_FILE);
    }

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
    expect(result.output).toContain('__check-no-forms-test-fixture__.tsx');
  });

  it('exits nonzero and names the file for a Prettier-wrapped multi-line self-closing tag', () => {
    writeFileSync(
      FIXTURE_FILE,
      `export function CheckNoFormsTestFixture() {\n  return (\n    <input\n      type="text"\n    />\n  );\n}\n`,
    );

    let result: { status: number; output: string };
    try {
      result = runScript();
    } finally {
      rmSync(FIXTURE_FILE);
    }

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
    expect(result.output).toContain('__check-no-forms-test-fixture__.tsx');
  });

  it('still exits 0 against the real src/pages/live/ contents (registry.ts, sample-project.tsx, and their tests) after the pattern broadened', () => {
    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('check:no-forms passed');
  });
});
