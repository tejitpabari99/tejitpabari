// Per-site ConsentBanner privacy link (SITE read at module load, so stub env,
// reset modules and dynamically import).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SiteId } from '@/data';

async function load(site: SiteId) {
  vi.stubEnv('VITE_SITE', site);
  vi.resetModules();
  const [{ ConsentBanner }, { ConsentProvider }] = await Promise.all([
    import('./ConsentBanner'),
    import('@/context/ConsentContext'),
  ]);
  return { ConsentBanner, ConsentProvider };
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  localStorage.clear();
});

const EXPECTED: Record<SiteId, string> = {
  main: '/privacy',
  healthtech: 'https://tejitpabari.com/privacy',
  nonprofit: 'https://tejitpabari.com/privacy',
};

describe.each(['main', 'healthtech', 'nonprofit'] as SiteId[])('ConsentBanner: %s', (site) => {
  it('privacy link points to the right place', async () => {
    const { ConsentBanner, ConsentProvider } = await load(site);
    render(
      <MemoryRouter>
        <ConsentProvider>
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );
    const link = await screen.findByRole('link', { name: 'Privacy Policy' });
    expect(link.getAttribute('href')).toBe(EXPECTED[site]);
  });
});
