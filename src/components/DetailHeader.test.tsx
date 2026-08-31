// src/components/DetailHeader.test.tsx
//
// Task 19 per .dev/website-revamp/04-projects-research-pages/TASKS.md.
// Covers PRD §4.4/§7's claim that DetailHeader's status pill is an
// absolute overlay with zero layout impact when absent — the same claim
// SP03's own ProjectCard.test.tsx already pins for ProjectCard.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetailHeader } from './DetailHeader';

function renderHeader(props: Partial<React.ComponentProps<typeof DetailHeader>> = {}) {
  return render(
    <DetailHeader image="/x.png" title="Juno" tags={['Health Tech']} {...props} />,
  );
}

describe('DetailHeader', () => {
  it('renders the status pill when status is provided', () => {
    renderHeader({ status: 'Building' });
    expect(screen.getByText('Building')).toBeInTheDocument();
  });

  it('does not render a status pill when status is absent', () => {
    renderHeader();
    // No text node anywhere in the document should be the pill's own
    // known-absent content.
    expect(screen.queryByText('Building')).not.toBeInTheDocument();
  });

  it('renders no extra DOM node/spacing in the image wrapper when status is absent (same claim ProjectCard pins)', () => {
    const { container } = renderHeader();
    const imageWrapper = container.querySelector('.bg-placeholder');
    expect(imageWrapper).not.toBeNull();
    // Only the <img> itself should be a child — no placeholder <span>/<div>
    // reserving space for a pill that isn't there.
    expect(imageWrapper!.children).toHaveLength(1);
    expect(imageWrapper!.children[0].tagName).toBe('IMG');
  });

  it('adds exactly one extra child (the pill span) to the image wrapper when status is present', () => {
    const { container } = renderHeader({ status: 'Completed' });
    const imageWrapper = container.querySelector('.bg-placeholder');
    expect(imageWrapper!.children).toHaveLength(2);
  });

  it('renders tags as TagPills when tags is non-empty', () => {
    renderHeader({ tags: ['Health Tech', 'Developer Tools'] });
    expect(screen.getByText('Health Tech')).toBeInTheDocument();
    expect(screen.getByText('Developer Tools')).toBeInTheDocument();
  });

  it('renders no tag group when tags is empty', () => {
    const { container } = renderHeader({ tags: [] });
    expect(container.querySelector('.flex-wrap')).toBeNull();
  });

  it('renders the title as an h1', () => {
    renderHeader({ title: 'Med-Doc Tracker' });
    expect(screen.getByRole('heading', { level: 1, name: 'Med-Doc Tracker' })).toBeInTheDocument();
  });
});
