import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const wf = (f: string) => readFileSync(path.join(root, '.github/workflows', f), 'utf8');

describe('PR preview workflow', () => {
  const pr = wf('firebase-hosting-pull-request.yml');

  it('builds all sites', () => {
    expect(pr).toContain('run: npm run build:all');
  });

  it.each(['main', 'admin', 'nonprofit', 'healthtech'])('deploys a %s preview behind the fork guard', (t) => {
    const steps = pr.split(/\n {6}- name: /).filter((s) => /\n\s+target: /.test(s));
    const step = steps.find((s) => new RegExp(`\\n\\s+target: ${t}\\n`).test(s));
    expect(step, `preview step for ${t}`).toBeDefined();
    expect(step).toContain('if: github.event.pull_request.head.repo.full_name == github.repository');
    expect(step).toContain('FirebaseExtended/action-hosting-deploy@');
    expect(step).toContain('projectId: tejitpabari-99');
  });
});

describe('merge workflow', () => {
  it('builds all sites and deploys once', () => {
    const merge = wf('firebase-hosting-merge.yml');
    expect(merge).toContain('run: npm run build:all');
    expect(merge.match(/firebase deploy/g)).toHaveLength(1);
    expect(merge).toContain('--only hosting,firestore');
  });
});

describe('ci workflow', () => {
  it('builds all and runs the script tests that npm test excludes', () => {
    const ci = wf('ci.yml');
    expect(ci).toContain('npm run build:all');
    for (const f of ['site-aware-build', 'check-no-em-dash', 'generate-sitemap', 'generate-og-cards', 'normalize-ssg-build-id', 'inject-csp-hashes']) {
      expect(ci).toContain(`scripts/${f}.test.ts`);
    }
    expect(ci).toContain('CHECK_LAUNCH=1');
  });
});
