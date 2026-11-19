import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

  describe('mobile menu', () => {
    const panelEl = () => document.getElementById('mobile-menu') as HTMLElement;

    it('renders a closed hamburger button with aria state and a hidden drawer', () => {
      render(<MemoryRouter><Nav /></MemoryRouter>);
      const btn = screen.getByRole('button', { name: 'Open menu' });
      expect(btn).toHaveAttribute('aria-expanded', 'false');
      expect(btn).toHaveAttribute('aria-controls', 'mobile-menu');
      expect(panelEl()).toHaveAttribute('aria-hidden', 'true');
      expect(panelEl().className).toContain('-translate-x-full');
    });

    it('opens a left side-panel dialog with the same links and active state', () => {
      render(<MemoryRouter initialEntries={['/']}><Nav /></MemoryRouter>);
      const btn = screen.getByRole('button', { name: 'Open menu' });
      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-expanded', 'true');
      const panel = panelEl();
      expect(panel).toHaveAttribute('role', 'dialog');
      expect(panel).toHaveAttribute('aria-modal', 'true');
      expect(panel).toHaveAttribute('aria-label', 'Menu');
      expect(panel).not.toHaveAttribute('aria-hidden', 'true');
      expect(panel.className).toContain('translate-x-0');
      expect(panel.className).toContain('left-0');
      const links = within(panel).getAllByRole('link');
      expect(links.map((l) => l.textContent)).toEqual([
        'Home', 'Projects', 'Work Experience', 'Health Tech', 'Non Profit', 'Blog', 'About',
      ]);
      const active = links.filter((l) => l.className.includes('bg-teal text-white'));
      expect(active.map((l) => l.textContent)).toEqual(['Home']);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('moves focus into the panel on open and back to the hamburger on close', () => {
      render(<MemoryRouter><Nav /></MemoryRouter>);
      const btn = screen.getByRole('button', { name: 'Open menu' });
      fireEvent.click(btn);
      expect(document.activeElement).toBe(within(panelEl()).getByRole('button', { name: 'Close menu' }));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(document.activeElement).toBe(btn);
      expect(document.body.style.overflow).toBe('');
    });

    it('closes on link click, Escape, backdrop click, and close button', () => {
      render(<MemoryRouter><Nav /></MemoryRouter>);
      const hamburger = screen.getByRole('button', { name: 'Open menu' });
      const open = () => fireEvent.click(hamburger);
      const isClosed = () => expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      open();
      fireEvent.click(within(panelEl()).getByRole('link', { name: 'Projects' }));
      isClosed();
      open();
      fireEvent.keyDown(document, { key: 'Escape' });
      isClosed();
      open();
      fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));
      isClosed();
      open();
      fireEvent.click(within(panelEl()).getByRole('button', { name: 'Close menu' }));
      isClosed();
    });
  });
});
