// src/components/LinksRow.test.tsx
//
// Round 3, r3-01-schema-icons-content: the "Open Live" CTA is gone (the
// whole /live subsystem was removed). LinksRow now renders one button per
// `links` entry — filled/dark-green (`bg-teal`) for the entry with
// `primary: true`, outlined otherwise — with an optional per-link icon
// (DynamicIcon when `icon` is set, the existing ExternalLinkIcon fallback
// otherwise). Still fires trackEvent('outbound_click', ...) with
// context: 'content_external_link' on every link click.
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
      <LinksRow links={[]} {...props} />
    </MemoryRouter>,
  );
}

describe('LinksRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when links is empty', () => {
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
});
