// Per-site: SITE is read at module load, so stub VITE_SITE, reset modules, import dynamically.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ trackEvent }));

async function setup() {
  vi.stubEnv('VITE_SITE', 'healthtech');
  vi.resetModules();
  const { HealthtechHomePage } = await import('./HealthtechHomePage');
  const { projectsForSite } = await import('@/data');
  const { HEALTHTECH_HERO_COPY } = await import('@/sections/HealthtechHero');
  render(<MemoryRouter><HealthtechHomePage /></MemoryRouter>);
  return { expected: projectsForSite('healthtech'), HEALTHTECH_HERO_COPY };
}

const cardHrefs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('a[href^="/projects/"]'))
    .map((a) => a.getAttribute('href')!)
    .filter((h, i, all) => all.indexOf(h) === i);

afterEach(() => { cleanup(); vi.unstubAllEnvs(); trackEvent.mockClear(); document.head.innerHTML = ''; });

describe('HealthtechHomePage', () => {
  it('renders hero copy, Onolys link, and all cards in projectsForSite order', async () => {
    const { expected, HEALTHTECH_HERO_COPY } = await setup();
    expect(screen.getByText(HEALTHTECH_HERO_COPY)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Visit Onolys' })).toHaveAttribute('href', 'https://onolys.com');
    expect(screen.getByRole('heading', { level: 2, name: 'All projects' })).toHaveAttribute('id', 'projects');
    expect(expected).toHaveLength(8);
    expect(cardHrefs(document.body)).toEqual(expected.map((p) => `/projects/${p.slug}`));
  });

  it('has no /live href and no main-only or nonprofit-only projects', async () => {
    await setup();
    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.filter((h) => /\/live/.test(h))).toEqual([]);
    expect(hrefs.filter((h) => /clip-verse|auto-emailer/.test(h))).toEqual([]);
    expect(document.body.textContent).not.toMatch(/clip-verse|auto-emailer/i);
  });

  it('renders RouteMeta title and description', async () => {
    await setup();
    expect(document.title).toBe('Tejit Pabari | Health Tech');
    const desc = document.querySelector('meta[name="description"]')!.getAttribute('content')!;
    expect(desc.length).toBeLessThan(160);
    expect(desc).toMatch(/^I build tools that make healthcare more accessible/);
    expect(desc.endsWith('clinical assessments.')).toBe(true);
  });

  it('fires project_card_click when a card is clicked', async () => {
    const { expected } = await setup();
    const first = expected[0];
    const link = document.querySelector(`a[href="/projects/${first.slug}"]`) as HTMLElement;
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith(
      'project_card_click',
      expect.objectContaining({ slug: first.slug, collection: 'projects', title: first.title }),
    );
  });

  it('filters by query, tag pill, clears from empty state, newest first with no query', async () => {
    const { expected } = await setup();
    const box = screen.getByLabelText('Search projects by name, description, or tag');
    const all = expected.map((p) => `/projects/${p.slug}`);

    // query narrows
    fireEvent.change(box, { target: { value: expected[0].title } });
    await waitFor(() => expect(cardHrefs(document.body).length).toBeLessThan(all.length));
    expect(cardHrefs(document.body)).toContain(`/projects/${expected[0].slug}`);
    fireEvent.change(box, { target: { value: '' } });
    await waitFor(() => expect(cardHrefs(document.body)).toEqual(all));

    // tag pill filters, preserving newest-first order
    const group = screen.getByRole('group', { name: 'Filter by tag' });
    const pill = group.querySelector('button')!;
    const tag = pill.textContent!;
    fireEvent.click(pill);
    expect(cardHrefs(document.body)).toEqual(
      expected.filter((p) => (p.tags as string[]).includes(tag)).map((p) => `/projects/${p.slug}`),
    );
    fireEvent.click(pill);
    expect(cardHrefs(document.body)).toEqual(all);

    // empty state + clear
    fireEvent.change(box, { target: { value: 'zzzzqqqxxnomatch' } });
    const clear = await screen.findByRole('button', { name: 'Clear search' });
    expect(cardHrefs(document.body)).toEqual([]);
    fireEvent.click(clear);
    await waitFor(() => expect(cardHrefs(document.body)).toEqual(all));
  });
});
