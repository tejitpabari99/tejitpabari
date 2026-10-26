import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders six items with the exact NAV_LINKS hrefs', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/', '/#projects', '/#work-experience', '/#about', '/#contact',
      'https://substack.com/@tejitpabari',
    ]);
  });

  it('renders Blog last, opening the Substack in a new tab', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    const blog = links[links.length - 1];
    expect(blog).toHaveTextContent('Blog');
    expect(blog).toHaveAttribute('href', 'https://substack.com/@tejitpabari');
    expect(blog).toHaveAttribute('target', '_blank');
    expect(blog).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('clears activeSection to null on a non-/ pathname', () => {
    render(<MemoryRouter initialEntries={['/research/foo']}><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.className).not.toContain('bg-teal text-white');
    }
  });

  it('highlights Home (not any section) at the untouched top of "/"', () => {
    render(<MemoryRouter initialEntries={['/']}><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    const active = links.filter((l) => l.className.includes('bg-teal text-white'));
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', '/');
  });
});
