import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders seven items in order with the exact hrefs', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Home', 'Projects', 'Work Experience', 'Health Tech', 'Non Profit', 'Blog', 'About',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/', '/#projects', '/#work-experience',
      'https://healthtech.tejitpabari.com', 'https://nonprofit.tejitpabari.com',
      'https://substack.com/@tejitpabari', '/#about',
    ]);
  });

  it('has no Contact tab', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Contact' })).toBeNull();
  });

  it('opens Blog in a new tab', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const blog = screen.getByRole('link', { name: 'Blog' });
    expect(blog).toHaveAttribute('href', 'https://substack.com/@tejitpabari');
    expect(blog).toHaveAttribute('target', '_blank');
    expect(blog).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('opens Health Tech and Non Profit in the same tab', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    for (const name of ['Health Tech', 'Non Profit']) {
      const link = screen.getByRole('link', { name });
      expect(link).not.toHaveAttribute('target');
      expect(link.className).not.toContain('bg-teal text-white');
    }
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

  it('highlights About (last section link) near the page bottom', () => {
    const sy = Object.getOwnPropertyDescriptor(window, 'scrollY');
    const sh = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight');
    const ih = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1700, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    try {
      render(<MemoryRouter initialEntries={['/']}><Nav /></MemoryRouter>);
      const active = screen.getAllByRole('link').filter((l) => l.className.includes('bg-teal text-white'));
      expect(active).toHaveLength(1);
      expect(active[0]).toHaveAttribute('href', '/#about');
    } finally {
      if (sy) Object.defineProperty(window, 'scrollY', sy); else Reflect.deleteProperty(window, 'scrollY');
      if (sh) Object.defineProperty(document.documentElement, 'scrollHeight', sh); else Reflect.deleteProperty(document.documentElement, 'scrollHeight');
      if (ih) Object.defineProperty(window, 'innerHeight', ih); else Reflect.deleteProperty(window, 'innerHeight');
    }
  });
});
