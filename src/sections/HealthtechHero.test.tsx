import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ trackEvent }));

import { HealthtechHero } from './HealthtechHero';

const APPROVED =
  'I build tools that make healthcare more accessible. Currently, I am building Onolys, a platform for quality control of clinical assessments.';

afterEach(() => { cleanup(); trackEvent.mockClear(); });

describe('HealthtechHero', () => {
  it('renders eyebrow and H1, no sub-label', () => {
    render(<HealthtechHero />);
    expect(screen.getByText('Health Tech Builder')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tejit Pabari' })).toBeInTheDocument();
    expect(screen.queryByText('Health tech projects')).not.toBeInTheDocument();
  });

  it('shows the portrait on the right (lg:order-2) and text on the left', () => {
    const { container } = render(<HealthtechHero />);
    const img = screen.getByAltText('Tejit Pabari');
    expect(img).toHaveAttribute('src', '/tejit-portrait.webp');
    expect(img.parentElement?.className).toContain('lg:order-2');
    expect(container.querySelector('h1')?.parentElement?.className).toContain('lg:order-1');
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
