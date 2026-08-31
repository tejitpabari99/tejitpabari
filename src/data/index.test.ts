import { describe, it, expect } from 'vitest';
import { validateInternalLinks, validateNavAndFooterLinks } from './index';
import type { Project } from '@/data';

function proj(slug: string, links: { label: string; href: string }[] = []): Project {
  return { slug, title: slug, description: 'd', image: '/x.png', tags: ['Others'], links, date: '2024-01-01', body: '' };
}

describe('validateInternalLinks', () => {
  it('passes when a link points at a real project slug', () => {
    expect(() => validateInternalLinks([proj('a'), proj('b', [{ label: 'x', href: '/projects/a' }])], [], [])).not.toThrow();
  });

  it('throws naming the source file and the unknown slug', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/projects/nonexistent' }])], [], []))
      .toThrow(/b\.md.*nonexistent/is);
  });

  it('throws on an unrecognized internal-looking path, not silently ignoring it', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/projets/foo' }])], [], []))
      .toThrow(/does not match a known route pattern|doesn't match a known route pattern/);
  });

  it('never checks an absolute external URL', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: 'https://example.com' }])], [], [])).not.toThrow();
  });

  it('passes a known static route without needing a slug lookup', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/work-experience' }])], [], [])).not.toThrow();
  });
});

describe('validateNavAndFooterLinks', () => {
  it('passes internal entries present in KNOWN_STATIC_ROUTES', () => {
    expect(() => validateNavAndFooterLinks([{ label: 'Projects', href: '/#projects' }], [])).not.toThrow();
  });

  it('throws on an internal entry whose pathname is not a known route', () => {
    expect(() => validateNavAndFooterLinks([{ label: 'Bad', href: '/nope' }], [])).toThrow(/KNOWN_STATIC_ROUTES/);
  });

  it('skips external entries entirely', () => {
    expect(() => validateNavAndFooterLinks([], [{ label: 'Résumé', href: 'https://drive.google.com/...' }])).not.toThrow();
  });
});
