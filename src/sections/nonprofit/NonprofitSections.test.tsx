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
import { ServicesAccordion } from './ServicesAccordion';

afterEach(() => { cleanup(); trackEvent.mockClear(); });

describe('NonprofitHero', () => {
  it('renders config text and booking link', () => {
    render(<NonprofitHero />);
    expect(screen.getByText(HERO_EYEBROW)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: HERO_HEADING })).toBeInTheDocument();
    expect(screen.getByText(/^Small nonprofit teams/).textContent).toBe(HERO_TEXT);
    const link = screen.getByRole('link', { name: BOOK_LABEL });
    expect(link).toHaveAttribute('href', BOOKING_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.className).toContain('min-h-[44px]');
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
    expect(screen.getByText(/^A consultation is/).textContent).toBe(STATEMENT_TEXT);
  });
});

describe('ServicesAccordion', () => {
  const buttons = () => screen.getAllByRole('button');

  it('has heading and 4 collapsed buttons in order, inside h3', () => {
    render(<ServicesAccordion />);
    expect(screen.getByRole('heading', { level: 2, name: SERVICES_HEADING })).toBeInTheDocument();
    expect(buttons()).toHaveLength(4);
    buttons().forEach((b, i) => {
      expect(b).toHaveAttribute('type', 'button');
      expect(b).toHaveAttribute('aria-expanded', 'false');
      expect(b.textContent).toContain(SERVICES[i].title);
      expect(b.textContent).toContain(SERVICES[i].teaser);
      expect(b.closest('h3')).not.toBeNull();
    });
  });

  it('aria-controls resolves to a labelled region, hidden when closed', () => {
    render(<ServicesAccordion />);
    buttons().forEach((b) => {
      const panel = document.getElementById(b.getAttribute('aria-controls')!)!;
      expect(panel).toHaveAttribute('role', 'region');
      expect(panel).toHaveAttribute('aria-labelledby', b.id);
      expect(panel).toHaveAttribute('hidden');
    });
  });

  it('click toggles, shows config body, fires service_toggle on open only', () => {
    render(<ServicesAccordion />);
    const [first] = buttons();
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(first.getAttribute('aria-controls')!)!;
    expect(panel).not.toHaveAttribute('hidden');
    expect(panel.textContent).toBe(SERVICES[0].body);
    expect(trackEvent).toHaveBeenCalledWith('service_toggle', { service: SERVICES[0].slug, expanded: true });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('allows multiple open at once', () => {
    render(<ServicesAccordion />);
    fireEvent.click(buttons()[0]);
    fireEvent.click(buttons()[2]);
    expect(buttons().map((b) => b.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'true', 'false']);
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('buttons are natively focusable (Enter/Space activation is browser-native)', () => {
    render(<ServicesAccordion />);
    const [first] = buttons();
    first.focus();
    expect(first).toHaveFocus();
    expect(first.tagName).toBe('BUTTON');
    expect(first).not.toHaveAttribute('tabindex', '-1');
    expect(first.className).toContain('focus-visible:');
    expect(first.className).toContain('min-h-[44px]');
  });

  it('renders second booking CTA with source services', () => {
    render(<ServicesAccordion />);
    const link = screen.getByRole('link', { name: BOOK_LABEL });
    expect(link).toHaveAttribute('href', BOOKING_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.className).toContain('min-h-[44px]');
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith('book_consultation_click', { source: 'services' });
    expect(within(link.closest('section')!).getAllByRole('button')).toHaveLength(4);
  });
});
