// src/config/site.test.ts
//
// Task 14 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's second
// bullet. Exercises `absoluteUrl`, the single helper every absolute-URL
// construction in the app (RouteMeta's og:url/canonical, in-app callers of
// og-card paths) routes through.
import { describe, it, expect } from 'vitest';
import { absoluteUrl } from './site';

describe('absoluteUrl', () => {
  it('resolves a root-relative path to the full site URL', () => {
    expect(absoluteUrl('/projects')).toBe('https://tejitpabari.com/projects');
  });

  it('passes an already-absolute https:// URL through unchanged', () => {
    expect(absoluteUrl('https://images.unsplash.com/photo-1')).toBe('https://images.unsplash.com/photo-1');
  });

  it('passes an already-absolute http:// URL through unchanged too', () => {
    // The regex is /^https?:\/\// — both schemes must short-circuit, not
    // just https.
    expect(absoluteUrl('http://example.com/x')).toBe('http://example.com/x');
  });

  it('handles a path missing its leading slash defensively', () => {
    expect(absoluteUrl('projects')).toBe('https://tejitpabari.com/projects');
  });
});
