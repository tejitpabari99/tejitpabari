import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ trackEvent }));

import { HealthtechHero } from './HealthtechHero';

const APPROVED =
  "I build tools that make healthcare easier to understand, from a self-testing app to an AI companion for doctor visits and plain-language care plans. Today I'm building Onolys, AI that helps check the quality of clinical assessments.";

afterEach(() => { cleanup(); trackEvent.mockClear(); });

describe('HealthtechHero', () => {
  it('renders eyebrow, H1 and sub-label', () => {
    render(<HealthtechHero />);
    expect(screen.getByText('Health Tech Builder')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tejit Pabari' })).toBeInTheDocument();
    expect(screen.getByText('Health tech projects')).toBeInTheDocument();
  });

  it('paragraph equals approved copy exactly, no em dash', () => {
    render(<HealthtechHero />);
    const p = screen.getByText(/^I build tools/);
    expect(p.textContent).toBe(APPROVED);
    expect(p.textContent).not.toContain('—');
  });

  it('CTA link has correct href, target, rel and fires outbound_click', () => {
    render(<HealthtechHero />);
    const a = screen.getByRole('link', { name: 'Visit Onolys' });
    expect(a).toHaveAttribute('href', 'https://onolys.com');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noreferrer');
    fireEvent.click(a);
    expect(trackEvent).toHaveBeenCalledWith(
      'outbound_click',
      expect.objectContaining({ source: 'healthtech_hero', url: 'https://onolys.com' }),
    );
  });
});
