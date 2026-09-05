// src/components/ProjectListCard.test.tsx
//
// Round 3, PRD item 1: the horizontal list-card layout replacing the
// 3-across ProjectCard grid on /projects and /research.
//
// Round 3.3 (owner clarification: "/live is a routing concept, not a
// button"): ProjectListCard renders links[] EXACTLY as authored whenever
// it has at least one entry - no live button prepended, no reordering, no
// dedupe, no label/icon inheritance (all removed from round 3.2's
// behavior). The ONLY place `live` still affects this card is the single
// fallback case covered in the "live" describe block below: an entry with
// no links[] at all gets one live-link button instead of nothing, via
// src/lib/resolveLiveLinks.ts's resolveCardLinks.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectListCard } from './ProjectListCard';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// A non-empty default `links` fixture, deliberately: with round 3.3's
// "empty links[] gets a fallback live button" rule, a default of `links:
// []` would silently give every test below (title, status, tags,
// techTags - none of which care about link-button behavior) an extra,
// unrelated fallback button to account for. Tests that specifically want
// the empty-links[] case override `links: []` explicitly, in the "live"
// describe block below.
const DEFAULT_LINKS = [{ label: 'Website', href: 'https://example.com' }];

function renderCard(props: Partial<React.ComponentProps<typeof ProjectListCard>> = {}) {
  return render(
    <MemoryRouter>
      <ProjectListCard
        href="/projects/foo"
        image="/x.png"
        title="Foo"
        description="A project."
        tags={['Health Tech']}
        links={DEFAULT_LINKS}
        slug="foo"
        collection="projects"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ProjectListCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title link, description, and image', () => {
    const { container } = renderCard();
    expect(screen.getByRole('link', { name: 'Foo' })).toHaveAttribute('href', '/projects/foo');
    expect(screen.getByText('A project.')).toBeInTheDocument();
    // An <img alt=""> is decorative (role="presentation", not "img") - a
    // plain DOM query rather than getByRole is the correct check here.
    expect(container.querySelector('img')).toHaveAttribute('src', '/x.png');
  });

  it('renders the status pill only when status is provided', () => {
    const { rerender } = renderCard({ status: 'Building' });
    expect(screen.getByText('Building')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectListCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} links={DEFAULT_LINKS} slug="foo" collection="projects" />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Building')).not.toBeInTheDocument();
  });

  it('renders category tags and techTags in two separate, visually distinct groups', () => {
    renderCard({ tags: ['Health Tech'], techTags: ['React', 'TypeScript'] });
    const categoryTag = screen.getByText('Health Tech');
    const techTag = screen.getByText('React');
    expect(categoryTag).toBeInTheDocument();
    expect(techTag).toBeInTheDocument();
    // Different styling - category tags use TagPill's bolder treatment,
    // techTags use TechTagList's subtler one.
    expect(categoryTag.className).not.toEqual(techTag.className);
    expect(techTag.className).toContain('text-slate');
    // Not the same wrapping row.
    expect(categoryTag.parentElement).not.toBe(techTag.parentElement);
  });

  it('handles an empty techTags array (renders no tech tag group)', () => {
    const { container } = renderCard({ tags: ['Health Tech'], techTags: [] });
    expect(screen.getByText('Health Tech')).toBeInTheDocument();
    // Two flex-wrap rows: the category tags, and the (always-present,
    // since DEFAULT_LINKS is non-empty) link-buttons row - no third row
    // for the empty techTags group.
    expect(container.querySelectorAll('.flex-wrap')).toHaveLength(2);
  });

  it('handles an omitted techTags prop the same as empty', () => {
    const { container } = renderCard({ tags: [] });
    // Only the link-buttons row (DEFAULT_LINKS is non-empty) - no
    // category-tags row (tags: []) and no techTags row (omitted).
    expect(container.querySelectorAll('.flex-wrap')).toHaveLength(1);
  });

  it('renders links[] exactly as authored - no reordering, no extra button, regardless of "live"', () => {
    renderCard({
      links: [
        { label: 'Website', href: 'https://example.com', primary: true },
        { label: 'GitHub', href: 'https://github.com/x' },
      ],
      live: { type: 'external', href: 'https://app.example.com' },
    });
    // Title link + exactly the two authored links - three total, in
    // author order, live.href nowhere among them.
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[1]).toHaveAttribute('href', 'https://example.com');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/x');
    expect(screen.queryByRole('link', { name: /^Live$/i })).not.toBeInTheDocument();
  });

  it('the link marked primary gets the filled dark-green treatment; others render outlined', () => {
    renderCard({
      links: [
        { label: 'Website', href: 'https://example.com', primary: true },
        { label: 'GitHub', href: 'https://github.com/x' },
      ],
    });
    const primaryLink = screen.getByRole('link', { name: /Website/i });
    const secondaryLink = screen.getByRole('link', { name: /GitHub/i });
    expect(primaryLink.className).toContain('bg-teal');
    expect(secondaryLink.className).toContain('border-teal-secondary');
    expect(secondaryLink.className).not.toContain('bg-teal ');
  });

  it('renders the specified icon on a link when "icon" is set', () => {
    renderCard({ links: [{ label: 'Chrome Web Store', href: 'https://x.com', icon: 'puzzle' }] });
    const link = screen.getByRole('link', { name: /Chrome Web Store/i });
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass('lucide-puzzle');
  });

  it('clicking an external link button does not trigger card navigation (stops propagation, fires outbound_click)', () => {
    const onCardClick = vi.fn();
    renderCard({
      onCardClick,
      links: [{ label: 'GitHub', href: 'https://github.com/x' }],
    });

    fireEvent.click(screen.getByRole('link', { name: /GitHub/i }));

    expect(onCardClick).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
      url: 'https://github.com/x',
      context: 'content_external_link',
      label: 'GitHub',
    });
  });

  it('link buttons open in a new tab with rel="noreferrer"', () => {
    renderCard({ links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('clicking the title link calls onCardClick', () => {
    const onCardClick = vi.fn();
    renderCard({ onCardClick });
    fireEvent.click(screen.getByRole('link', { name: 'Foo' }));
    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  // Round 3.3: the ONLY place `live` affects this card - an entry with no
  // links[] at all gets a single live-link button instead of showing
  // nothing. Wiring-level only - resolveCardLinks itself is exhaustively
  // covered in src/lib/resolveLiveLinks.test.ts.
  describe('live (empty-links[] fallback only)', () => {
    it('renders a single live-link button, pointed at the internal /live href, when links[] is empty', () => {
      renderCard({ links: [], slug: 'sample-project', collection: 'projects' });
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2); // title link + the one fallback button
      expect(links[1]).toHaveAttribute('href', '/projects/sample-project/live');
      expect(links[1]).toHaveTextContent('Live');
    });

    it('uses live.label/live.icon for that fallback button when set', () => {
      renderCard({
        links: [],
        live: { type: 'external', href: 'https://app.example.com', label: 'Open app', icon: 'rocket' },
        slug: 'sample-project',
        collection: 'projects',
      });
      const button = screen.getByRole('link', { name: /Open app/i });
      expect(button).toHaveAttribute('href', '/projects/sample-project/live');
      expect(button.querySelector('svg')).toHaveClass('lucide-rocket');
    });

    it('falls back to "Live"/globe when links[] is empty and "live" is entirely absent too', () => {
      renderCard({ links: [], live: undefined, slug: 'sample-project', collection: 'projects' });
      const button = screen.getByRole('link', { name: /^Live$/i });
      expect(button.querySelector('svg')).toHaveClass('lucide-globe');
    });

    it('uses the "research" collection to build the fallback href', () => {
      renderCard({ links: [], slug: 'flood-nlp', collection: 'research', href: '/research/flood-nlp' });
      expect(screen.getByRole('link', { name: /^Live$/i })).toHaveAttribute('href', '/research/flood-nlp/live');
    });

    it("clicking the fallback button fires trackEvent('live_link_click'), not outbound_click", () => {
      renderCard({ links: [], slug: 'sample-project', collection: 'projects' });
      fireEvent.click(screen.getByRole('link', { name: /^Live$/i }));

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('live_link_click', {
        url: '/projects/sample-project/live',
        label: 'Live',
      });
    });
  });
});
