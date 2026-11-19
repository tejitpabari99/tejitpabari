import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ trackEvent }));

import {
  BOOKING_URL, BOOK_LABEL, HERO_EYEBROW, HERO_HEADING, HERO_TEXT,
  SERVICES, SERVICES_HEADING, STATEMENT_HEADING, STATEMENT_TEXT,
} from '@/config/nonprofit';
import { NonprofitHero } from './NonprofitHero';
import { ConsultationStatement } from './ConsultationStatement';
import { ServicesCards } from './ServicesCards';

afterEach(() => { cleanup(); trackEvent.mockClear(); });

describe('NonprofitHero', () => {
  it('renders config text and booking link', () => {
    render(<NonprofitHero />);
    expect(screen.getByText(HERO_EYEBROW)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: HERO_HEADING })).toBeInTheDocument();
    expect(screen.getByText(/^I audit a nonprofit/).textContent).toBe(HERO_TEXT);
    const link = screen.getByRole('link', { name: BOOK_LABEL });
    expect(link).toHaveAttribute('href', BOOKING_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.className).toContain('min-h-[44px]');
  });

  it('shows the portrait', () => {
    render(<NonprofitHero />);
    expect(screen.getByRole('img', { name: 'Tejit Pabari' })).toHaveAttribute('src', '/tejit-portrait.webp');
  });

  it('fires book_consultation_click with source hero', () => {
    render(<NonprofitHero />);
    fireEvent.click(screen.getByRole('link', { name: BOOK_LABEL }));
    expect(trackEvent).toHaveBeenCalledWith('book_consultation_click', { source: 'hero' });
  });
});

describe('ConsultationStatement', () => {
  it('renders H2 and text from config', () => {
    render(<ConsultationStatement />);
    expect(screen.getByRole('heading', { level: 2, name: STATEMENT_HEADING })).toBeInTheDocument();
    const section = document.getElementById('consultation')!;
    expect(section.className).toContain('scroll-mt-24');
    expect(screen.getByText(/^A consultation is/).textContent).toBe(STATEMENT_TEXT);
  });
});

describe('ServicesCards', () => {
  it('renders heading and 3 fully visible cards in order, no buttons', () => {
    render(<ServicesCards />);
    expect(screen.getByRole('heading', { level: 2, name: SERVICES_HEADING })).toBeInTheDocument();
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    cards.forEach((c, i) => {
      expect(within(c).getByRole('heading', { level: 3, name: SERVICES[i].title })).toBeInTheDocument();
      expect(c.textContent).toContain(SERVICES[i].teaser);
      expect(c.textContent).toContain(SERVICES[i].body);
      expect(c).not.toHaveAttribute('hidden');
    });
    expect(document.querySelector('[aria-expanded]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/mentoring/i)).toBeNull();
  });

  it('lays out 1/2/3 columns and tints each card differently', () => {
    render(<ServicesCards />);
    const cards = screen.getAllByRole('article');
    const grid = cards[0].parentElement!;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('lg:grid-cols-3');
    expect(new Set(cards.map((c) => c.className.split(' ').find((x) => x.startsWith('bg-')))).size).toBe(3);
  });

  it('renders booking CTA with source services', () => {
    render(<ServicesCards />);
    const link = screen.getByRole('link', { name: BOOK_LABEL });
    expect(link).toHaveAttribute('href', BOOKING_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.className).toContain('min-h-[44px]');
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith('book_consultation_click', { source: 'services' });
  });
});
