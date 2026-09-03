// src/components/RouteMeta.test.tsx
//
// Task 13 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's first
// bullet. Uses SP01's src/setupTests.ts `<Head>`-passthrough mock (already
// in place, no new harness work needed here): `<Head>` renders its
// children directly into the tree, and React 19 then auto-hoists
// <title>/<meta>/<link> elements to document.head regardless of where in
// the tree they were rendered (confirmed by src/pages/PrivacyPage.test.tsx's
// own note on this exact mechanism) — so assertions below query
// document.head / document.title directly, the same idiom PrivacyPage.test
// already established for a real RouteMeta call site.
//
// This file pins the binding contract PRD §4.2 fixes and SP04/SP05 already
// depend on by name: props are exactly { title, description, path, image? };
// og:type is always the literal "website"; og:image:width/og:image:height
// are always "1200"/"630" regardless of props; `image` defaults to
// DEFAULT_OG_IMAGE and is always emitted as an absolute URL.
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

  it('always emits 1200x630 image dimensions and og:type website with the default image', () => {
    render(<RouteMeta title="X" description="d" path="/x" />);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
  });

  it('still emits 1200x630 image dimensions and og:type website with an explicit image prop', () => {
    // Binding contract: width/height/type never vary with props, including
    // when a real per-route OG image is supplied instead of the default.
    render(<RouteMeta title="Y" description="d2" path="/y" image="/og/research/foo.png" />);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
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
});
