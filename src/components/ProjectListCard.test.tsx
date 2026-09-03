// src/components/ProjectListCard.test.tsx
//
// Round 3, PRD item 1: the horizontal list-card layout replacing the
// 3-across ProjectCard grid on /projects and /research.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectListCard } from './ProjectListCard';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

function renderCard(props: Partial<React.ComponentProps<typeof ProjectListCard>> = {}) {
  return render(
    <MemoryRouter>
      <ProjectListCard
        href="/projects/foo"
        image="/x.png"
        title="Foo"
        description="A project."
        tags={['Health Tech']}
        links={[]}
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
        <ProjectListCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} links={[]} />
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
    // Only one flex-wrap tag row (the category tags) should exist.
    expect(container.querySelectorAll('.flex-wrap')).toHaveLength(1);
  });

  it('handles an omitted techTags prop the same as empty', () => {
    const { container } = renderCard({ tags: [] });
    expect(container.querySelectorAll('.flex-wrap')).toHaveLength(0);
  });

  it('handles an empty links array (renders no link buttons)', () => {
    renderCard({ links: [] });
    expect(screen.queryAllByRole('link')).toHaveLength(1); // just the title link
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
});
