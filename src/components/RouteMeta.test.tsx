// src/components/RouteMeta.test.tsx
//
// Task 13 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's first
// bullet. Uses SP01's setupTests.ts <Head>-passthrough mock (already in
// place, no new harness work needed here): <Head> renders its children
// directly into the tree, and React 19 then auto-hoists
// <title>/<meta>/<link> elements to document.head regardless of where in
// the tree they were rendered (confirmed by src/pages/PrivacyPage.test.tsx's
// own note on this exact mechanism) — so assertions below query
// document.head / document.title directly, the same idiom PrivacyPage.test
// already established for a real RouteMeta call site.
//
// This file pins the binding contract PRD §4.2 fixes and SP04/SP05 already
// depend on by name, extended for the sharing/rich-preview follow-up round:
// props are { title, description, path, image?, imageAlt?, type?,
// publishedTime? }; og:image:width/height are always "1200"/"630"
// regardless of props; `image` defaults to DEFAULT_OG_IMAGE and is always
// emitted as an absolute URL; `type` defaults to "website" but an explicit
// "article" call site (project/research detail + /live pages) flips
// og:type and, when publishedTime is also given, adds
// article:published_time — the one deliberate reversal of this file's
// earlier "og:type is always website" pin, made explicit here rather than
// silently dropped (see RouteMeta.tsx's own header comment on the prop).
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RouteMeta } from './RouteMeta';

describe('RouteMeta', () => {
  it('defaults image to DEFAULT_OG_IMAGE, resolved absolute, when omitted', () => {
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" />);
    expect(document.title).toBe('Juno · Tejit Pabari');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tejitpabari.com/projects/juno',
    );
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://tejitpabari.com/og/default.png',
    );
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://tejitpabari.com/og/default.png',
    );
  });

  it('resolves an explicit image prop to its absolute form', () => {
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" image="/og/projects/juno.png" />);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://tejitpabari.com/og/projects/juno.png',
    );
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://tejitpabari.com/og/projects/juno.png',
    );
  });

  it('always emits 1200x630 image dimensions regardless of props', () => {
    render(<RouteMeta title="X" description="d" path="/x" />);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
  });

  it('always emits 1200x630 image dimensions with an explicit image prop too', () => {
    render(<RouteMeta title="Y" description="d2" path="/y" image="/og/research/foo.png" />);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
  });

  it('appends the " · Tejit Pabari" suffix to og:title/twitter:title as well as <title>', () => {
    render(<RouteMeta title="Projects" description="A list of things I have built." path="/projects" />);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Projects · Tejit Pabari');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Projects · Tejit Pabari');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'A list of things I have built.',
    );
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'A list of things I have built.',
    );
  });

  it('does not duplicate the site name when title already equals SITE_NAME', () => {
    // Regression test for the reported "Tejit Pabari · Tejit Pabari" tab
    // title bug: HomePage passes title="Tejit Pabari", which equals
    // SITE_NAME exactly, so the " · SITE_NAME" suffix must not be appended.
    render(<RouteMeta title="Tejit Pabari" description="d" path="/" />);
    expect(document.title).toBe('Tejit Pabari');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Tejit Pabari');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Tejit Pabari');
  });

  it('defaults og:type to "website" and og:locale to "en_US"', () => {
    render(<RouteMeta title="Research" description="d" path="/research" />);
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
  });

  it('switches og:type to "article" when type="article" is passed, and og:locale stays en_US', () => {
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" type="article" />);
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article');
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
  });

  it('emits article:published_time only when type="article" AND publishedTime is given', () => {
    render(
      <RouteMeta
        title="Juno"
        description="d"
        path="/projects/juno"
        type="article"
        publishedTime="2026-01-15T00:00:00.000Z"
      />,
    );
    expect(document.querySelector('meta[property="article:published_time"]')?.getAttribute('content')).toBe(
      '2026-01-15T00:00:00.000Z',
    );
  });

  it('never emits article:published_time for the default "website" type, even if publishedTime is passed', () => {
    render(<RouteMeta title="Home" description="d" path="/" publishedTime="2026-01-15T00:00:00.000Z" />);
    expect(document.querySelector('meta[property="article:published_time"]')).toBeNull();
  });

  it('omits article:published_time when type="article" but no publishedTime is given', () => {
    // Never invent a date: an article-type call site with no date to give
    // (there is none today, but the component must not silently fabricate
    // one if that ever happens) simply omits the tag.
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" type="article" />);
    expect(document.querySelector('meta[property="article:published_time"]')).toBeNull();
  });

  it('defaults og:image:alt/twitter:image:alt to "<full title> preview image" when imageAlt is omitted', () => {
    render(<RouteMeta title="Projects" description="d" path="/projects" />);
    expect(document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')).toBe(
      'Projects · Tejit Pabari preview image',
    );
    expect(document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content')).toBe(
      'Projects · Tejit Pabari preview image',
    );
  });

  it('uses an explicit imageAlt for og:image:alt/twitter:image:alt when given', () => {
    render(
      <RouteMeta
        title="Juno"
        description="d"
        path="/projects/juno"
        imageAlt="Juno project preview image"
      />,
    );
    expect(document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')).toBe(
      'Juno project preview image',
    );
    expect(document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content')).toBe(
      'Juno project preview image',
    );
  });

  it('always emits og:site_name', () => {
    render(<RouteMeta title="Terms of Use" description="d" path="/terms" />);
    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe('Tejit Pabari');
  });
});
