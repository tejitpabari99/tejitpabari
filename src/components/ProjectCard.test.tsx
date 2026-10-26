import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';

function renderCard(props: Partial<React.ComponentProps<typeof ProjectCard>> = {}) {
  return render(
    <MemoryRouter>
      <ProjectCard
        href="/projects/foo"
        image="/x.png"
        title="Foo"
        description="A project."
        tags={['Health Tech']}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ProjectCard', () => {
  it('renders the title link with the given href', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'Foo' })).toHaveAttribute('href', '/projects/foo');
  });

  it('renders the status pill only when status is provided', () => {
    const { rerender } = renderCard({ status: 'Building' });
    expect(screen.getByText('Building')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Building')).not.toBeInTheDocument();
  });

  it('renders the external-link icon only when externalHref is provided', () => {
    const { rerender } = renderCard({ externalHref: 'https://example.com' });
    expect(screen.getByRole('link', { name: /Open Foo externally/i })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /Open Foo externally/i })).not.toBeInTheDocument();
  });

  it('clicking the external-link icon calls onExternalClick and not onCardClick', () => {
    const onCardClick = vi.fn();
    const onExternalClick = vi.fn();
    renderCard({ externalHref: 'https://example.com', onCardClick, onExternalClick });

    fireEvent.click(screen.getByRole('link', { name: /Open Foo externally/i }));

    expect(onExternalClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('clicking the title link calls onCardClick and not onExternalClick', () => {
    const onCardClick = vi.fn();
    const onExternalClick = vi.fn();
    renderCard({ externalHref: 'https://example.com', onCardClick, onExternalClick });

    fireEvent.click(screen.getByRole('link', { name: 'Foo' }));

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onExternalClick).not.toHaveBeenCalled();
  });
});
