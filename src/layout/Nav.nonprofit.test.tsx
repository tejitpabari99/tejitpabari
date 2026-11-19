import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/config/site-target', () => ({ SITE: 'nonprofit', SITE_CONFIG: {} }));

import { Nav } from './Nav';

describe('Nav (nonprofit)', () => {
  it('lists Consultation after Home', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const labels = screen.getAllByRole('link').map((l) => l.textContent);
    expect(labels.slice(0, 2)).toEqual(['Home', 'Consultation']);
  });

  it('does not highlight Consultation via the near-bottom fallback (single section link)', () => {
    const d = (o: object, k: string, v: number) => Object.defineProperty(o, k, { value: v, configurable: true });
    d(window, 'scrollY', 900);
    d(document.documentElement, 'scrollHeight', 1700);
    d(window, 'innerHeight', 800);
    try {
      render(<MemoryRouter initialEntries={['/']}><Nav /></MemoryRouter>);
      const consult = screen.getByRole('link', { name: 'Consultation' });
      expect(consult.className).not.toContain('bg-teal text-white');
    } finally {
      for (const [o, k] of [[window, 'scrollY'], [document.documentElement, 'scrollHeight'], [window, 'innerHeight']] as const) Reflect.deleteProperty(o, k);
    }
  });
});
