// scripts/check-no-forms.test.ts
//
// Round 3 (r3-01-schema-icons-content): the /live subsystem was deleted, so
// src/pages/live/ no longer exists on disk. check-no-forms.sh's own new
// early-exit branch (`[ ! -d src/pages/live ]`) is what this file now
// exercises against the real repo state — plus a synthetic re-check of the
// original "input-accepting markup" guard logic against a throwaway
// src/pages/live/ directory, created and torn down within this one test, so
// that logic still has coverage even though the real directory is gone.
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
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const LIVE_DIR = path.join(REPO_ROOT, 'src', 'pages', 'live');

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
  // repo must never end up with a leftover src/pages/live/ directory (the
  // whole point of round 3's removal) breaking a later `check:no-forms` run.
  afterEach(() => {
    if (existsSync(LIVE_DIR)) {
      rmSync(LIVE_DIR, { recursive: true, force: true });
    }
  });

  it('exits 0 against the real repo, where src/pages/live/ no longer exists', () => {
    expect(existsSync(LIVE_DIR)).toBe(false);
    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('check:no-forms passed');
    expect(output).toContain('does not exist');
  });

  it('exits nonzero and names the offending file when a bare <input> is added under a (re-created) src/pages/live/', () => {
    mkdirSync(LIVE_DIR, { recursive: true });
    writeFileSync(
      path.join(LIVE_DIR, '__check-no-forms-test-fixture__.tsx'),
      `export function CheckNoFormsTestFixture() {\n  return <input type="text" />;\n}\n`,
    );

    const result = runScript();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
    expect(result.output).toContain('__check-no-forms-test-fixture__.tsx');
  });

  it('exits nonzero for a bare self-closing tag ("<input/>", no space before "/") under a (re-created) src/pages/live/', () => {
    mkdirSync(LIVE_DIR, { recursive: true });
    writeFileSync(
      path.join(LIVE_DIR, '__check-no-forms-test-fixture__.tsx'),
      `export function CheckNoFormsTestFixture() {\n  return <input/>;\n}\n`,
    );

    const result = runScript();

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('FRAGILITY GUARD FAILED');
  });

  it('is clean again (exits 0, "does not exist") immediately after the re-created directory is removed', () => {
    mkdirSync(LIVE_DIR, { recursive: true });
    writeFileSync(path.join(LIVE_DIR, 'placeholder.tsx'), 'export {};\n');
    rmSync(LIVE_DIR, { recursive: true, force: true });

    const { status, output } = runScript();
    expect(status).toBe(0);
    expect(output).toContain('does not exist');
    expect(existsSync(LIVE_DIR)).toBe(false);
  });
});
