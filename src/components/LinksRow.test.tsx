// src/components/LinksRow.test.tsx
//
// Round 3, r3-01-schema-icons-content: LinksRow renders one button per
// `links` entry — filled/dark-green (`bg-teal`) for the entry with
// `primary: true`, outlined otherwise — with an optional per-link icon
// (DynamicIcon when `icon` is set, the existing ExternalLinkIcon fallback
// otherwise). Still fires trackEvent('outbound_click', ...) with
// context: 'content_external_link' on every link click.
//
// Round 3.2: LinksRow's own "live" behavior is now a thin wrapper around
// src/lib/resolveLiveLinks.ts (label/icon inheritance, dedupe, primary/
// secondary resolution all live there and are exhaustively unit-tested in
// resolveLiveLinks.test.ts) - the "live" describe block below only proves
// LinksRow actually calls that helper and renders its result, not the
// resolution rules themselves.
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { LinksRow } from './LinksRow';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

function renderLinksRow(props: Partial<React.ComponentProps<typeof LinksRow>> = {}) {
  return render(
    <MemoryRouter>
      <LinksRow links={[]} slug="foo" collection="projects" {...props} />
    </MemoryRouter>,
  );
}

describe('LinksRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when links is empty and there is no "live" field', () => {
    const { container } = renderLinksRow({ links: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a labeled link for each entry in links', () => {
    renderLinksRow({
      links: [
        { label: 'Pre-print paper', href: 'https://arxiv.org/abs/x' },
        { label: 'GitHub', href: 'https://github.com/x' },
      ],
    });
    expect(screen.getByRole('link', { name: /Pre-print paper/i })).toHaveAttribute('href', 'https://arxiv.org/abs/x');
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute('href', 'https://github.com/x');
  });

  it('applies the filled dark-green (bg-teal) style to exactly the link marked primary, and the outlined style to the rest', () => {
    renderLinksRow({
      links: [
        { label: 'Website', href: 'https://example.com', primary: true },
        { label: 'GitHub', href: 'https://github.com/x' },
      ],
    });
    const primaryLink = screen.getByRole('link', { name: /Website/i });
    const secondaryLink = screen.getByRole('link', { name: /GitHub/i });
    expect(primaryLink.className).toContain('bg-teal');
    expect(primaryLink.className).not.toContain('border-teal-secondary');
    expect(secondaryLink.className).toContain('border-teal-secondary');
    expect(secondaryLink.className).not.toContain('bg-teal ');
  });

  it('renders the specified DynamicIcon before the label when a link has an "icon"', () => {
    renderLinksRow({ links: [{ label: 'Chrome Web Store', href: 'https://chromewebstore.google.com/x', icon: 'puzzle' }] });
    const link = screen.getByRole('link', { name: /Chrome Web Store/i });
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass('lucide-puzzle');
  });

  it('falls back to the plain ExternalLinkIcon when a link has no "icon"', () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
    const link = screen.getByRole('link', { name: /GitHub/i });
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
    // ExternalLinkIcon is a hand-authored svg (no lucide-* class) — the
    // negative assertion distinguishes it from a DynamicIcon render.
    expect(svg?.getAttribute('class') ?? '').not.toContain('lucide-');
  });

  it("clicking a link fires trackEvent('outbound_click', ...) with context: 'content_external_link' and the correct label/url", () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
    fireEvent.click(screen.getByRole('link', { name: /GitHub/i }));

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
      url: 'https://github.com/x',
      context: 'content_external_link',
      label: 'GitHub',
    });
  });

  it('every link opens in a new tab with rel="noreferrer"', () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x', primary: true }] });
    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  // Round 3.1/3.2 (/live subsystem restoration + label/icon inheritance):
  // wiring-level coverage only - LinksRow passes {live, links, slug,
  // collection} straight through to resolveLiveLinks and renders whatever
  // comes back. The inheritance/dedupe/primary rules themselves are
  // exhaustively covered in src/lib/resolveLiveLinks.test.ts.
  describe('live', () => {
    it('renders nothing extra when "live" is omitted, even with links present', () => {
      renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('renders a live button first, using the INTERNAL /<collection>/<slug>/live href built from slug+collection, never live.href', () => {
      renderLinksRow({
        links: [{ label: 'GitHub', href: 'https://github.com/x' }],
        live: { type: 'external', href: 'https://app.meetjuno.health' },
        slug: 'juno',
        collection: 'projects',
      });
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/projects/juno/live');
    });

    it('uses the "research" collection to build the internal href when collection="research"', () => {
      renderLinksRow({
        links: [],
        live: { type: 'self', page: 'whatever' },
        slug: 'flood-nlp',
        collection: 'research',
      });
      expect(screen.getByRole('link')).toHaveAttribute('href', '/research/flood-nlp/live');
    });

    it("clicking the live button fires trackEvent('live_link_click'), not outbound_click", () => {
      renderLinksRow({
        links: [],
        live: { type: 'external', href: 'https://app.meetjuno.health', label: 'Open app' },
        slug: 'juno',
        collection: 'projects',
      });
      fireEvent.click(screen.getByRole('link', { name: /Open app/i }));

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('live_link_click', { url: '/projects/juno/live', label: 'Open app' });
    });

    it('still fires outbound_click/content_external_link for a real links[] entry when a live button is also present', () => {
      const { container } = renderLinksRow({
        // Two DISTINCT labels here on purpose: with only one links[] entry
        // and no explicit live.label, resolveLiveLinks would inherit that
        // entry's own label onto the live button too (correct behavior,
        // see resolveLiveLinks.test.ts), which would make both buttons
        // read "GitHub" and defeat a name-based query below.
        links: [{ label: 'GitHub', href: 'https://github.com/x' }],
        live: { type: 'external', href: 'https://app.meetjuno.health', label: 'Live' },
        slug: 'juno',
        collection: 'projects',
      });
      const githubLink = container.querySelector('a[href="https://github.com/x"]')!;
      fireEvent.click(githubLink);

      expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
        url: 'https://github.com/x',
        context: 'content_external_link',
        label: 'GitHub',
      });
    });
  });
});
