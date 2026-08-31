// src/components/LinksRow.test.tsx
//
// Task 19 per .dev/website-revamp/04-projects-research-pages/TASKS.md.
// LinksRow renders null with no links/liveHref, renders the "Open Live"
// CTA only when liveHref is set, and fires trackEvent('outbound_click', ...)
// with context: 'content_external_link' (NOT the old 'project_external_link')
// on an external link click.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

  it('renders nothing when links is empty and liveHref is undefined', () => {
    const { container } = renderLinksRow({ links: [], liveHref: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the "Open Live" CTA when liveHref is provided, pointing at that exact path', () => {
    renderLinksRow({ links: [], liveHref: '/projects/juno/live' });
    const cta = screen.getByRole('link', { name: /Open Live/i });
    expect(cta).toHaveAttribute('href', '/projects/juno/live');
  });

  it('does not render the "Open Live" CTA when liveHref is undefined', () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }], liveHref: undefined });
    expect(screen.queryByRole('link', { name: /Open Live/i })).not.toBeInTheDocument();
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

  it("clicking an external link fires trackEvent('outbound_click', ...) with context: 'content_external_link' and the correct label/url", () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
    fireEvent.click(screen.getByRole('link', { name: /GitHub/i }));

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
      url: 'https://github.com/x',
      context: 'content_external_link',
      label: 'GitHub',
    });
  });

  it('does not fire trackEvent when clicking the internal "Open Live" CTA', () => {
    renderLinksRow({ links: [], liveHref: '/projects/juno/live' });
    fireEvent.click(screen.getByRole('link', { name: /Open Live/i }));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('external links open in a new tab with rel="noreferrer"', () => {
    renderLinksRow({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
