// Per-site layout tests (01-multi-site-build Task 4). SITE is read at module
// load from import.meta.env.VITE_SITE, so each case stubs the env, resets the
// module graph and dynamically imports the component under test.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SiteId } from '@/data';

async function load(site: SiteId) {
  vi.stubEnv('VITE_SITE', site);
  vi.resetModules();
  const [{ Nav }, { Footer }, { LinksRow }, { RouteMeta }] = await Promise.all([
    import('./Nav'),
    import('./Footer'),
    import('@/components/LinksRow'),
    import('@/components/RouteMeta'),
  ]);
  return { Nav, Footer, LinksRow, RouteMeta };
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const NAV_EXPECTED: Record<SiteId, [string, string][]> = {
  main: [
    ['Home', '/'], ['Projects', '/#projects'], ['Work Experience', '/#work-experience'],
    ['Health Tech', 'https://healthtech.tejitpabari.com'], ['Non Profit', 'https://nonprofit.tejitpabari.com'],
    ['Blog', 'https://substack.com/@tejitpabari'], ['About', '/#about'],
  ],
  healthtech: [['Home', '/'], ['Projects', '/#projects'], ['Website', 'https://tejitpabari.com']],
  nonprofit: [
    ['Home', '/'], ['Projects', '/projects'], ['Schedule', '/schedule'], ['Website', 'https://tejitpabari.com'],
  ],
};

describe.each(['main', 'healthtech', 'nonprofit'] as SiteId[])('site layout: %s', (site) => {
  it('nav shows the site link set', async () => {
    const { Nav } = await load(site);
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual(NAV_EXPECTED[site]);
  });

  it('Website button only on subsites: same tab, not hidden at mobile width', async () => {
    const { Nav } = await load(site);
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const btn = screen.queryByRole('link', { name: 'Website' });
    if (site === 'main') {
      expect(btn).toBeNull();
      return;
    }
    expect(btn).toHaveAttribute('href', 'https://tejitpabari.com');
    expect(btn).not.toHaveAttribute('target');
    // Visible below the sm breakpoint: no unprefixed hidden/display-none class.
    const classes = (btn as HTMLElement).className.split(/\s+/);
    expect(classes).not.toContain('hidden');
    expect(classes.filter((c) => /^(sm|md|lg):hidden$/.test(c))).toEqual([]);
  });

  it('footer contents', async () => {
    const { Footer } = await load(site);
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const footer = screen.getByRole('contentinfo');
    const hrefs = Array.from(footer.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(screen.getByRole('link', { name: /techfolio/ })).toBeInTheDocument();
    if (site === 'main') {
      expect(hrefs).toEqual(expect.arrayContaining(['/research', '/privacy', '/terms']));
      expect(screen.getByRole('link', { name: 'Résumé' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'GitHub' })).toBeNull();
      return;
    }
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://tejitpabari.com/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://tejitpabari.com/terms');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tejitpabari99');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/tejitpabari');
    expect(screen.queryByRole('link', { name: 'Research' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Résumé' })).toBeNull();
    // Post-hydration: real mailto link.
    expect(screen.getByRole('link', { name: 'Email' }).getAttribute('href')).toMatch(/^mailto:/);
    // Pre-hydration (static render, no effects): obfuscated, no address in markup.
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(<MemoryRouter><Footer /></MemoryRouter>);
    expect(html).not.toContain('gmail.com');
    expect(html).not.toContain('mailto:');
  });

  it('synthetic live button hidden only when the site has no live routes', async () => {
    const { LinksRow } = await load(site);
    render(
      <MemoryRouter>
        <LinksRow
          links={[
            { label: 'Repo', href: 'https://github.com/x/y' },
            { label: 'Live', href: '/projects/foo/live', isLive: true } as never,
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Repo/ })).toBeInTheDocument();
    const live = screen.queryByRole('link', { name: /Live/ });
    if (site === 'main') expect(live).not.toBeNull();
    else expect(live).toBeNull();
  });

  it('canonical and og:url use the site URL', async () => {
    const { RouteMeta } = await load(site);
    render(<RouteMeta title="T" description="d" path="/projects/x" />);
    const base = { main: 'https://tejitpabari.com', healthtech: 'https://healthtech.tejitpabari.com', nonprofit: 'https://nonprofit.tejitpabari.com' }[site];
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${base}/projects/x`);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(`${base}/projects/x`);
  });
});
