// Per-site: SITE is read at module load, so stub VITE_SITE, reset modules, import dynamically.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const hookState = vi.hoisted(() => ({ value: { state: 'loading', items: [], groups: { active: [], done: [] } } as Record<string, unknown> }));
vi.mock('@/lib/schedule/useSchedule', () => ({ useSchedule: () => hookState.value }));

async function load() {
  vi.stubEnv('VITE_SITE', 'nonprofit');
  vi.resetModules();
  const pages = {
    Home: (await import('./NonprofitHomePage')).NonprofitHomePage,
    Projects: (await import('./NonprofitProjectsPage')).NonprofitProjectsPage,
    Schedule: (await import('./SchedulePage')).SchedulePage,
  };
  const { projectsForSite } = await import('@/data');
  const cfg = await import('@/config/nonprofit');
  return { pages, expected: projectsForSite('nonprofit'), cfg };
}

const cardHrefs = () =>
  Array.from(document.querySelectorAll('a[href^="/projects/"]'))
    .map((a) => a.getAttribute('href')!)
    .filter((h, i, all) => all.indexOf(h) === i);
const desc = () => document.querySelector('meta[name="description"]')!.getAttribute('content');

afterEach(() => { cleanup(); vi.unstubAllEnvs(); document.head.innerHTML = ''; hookState.value = { state: 'loading', items: [], groups: { active: [], done: [] } }; });

describe('nonprofit pages', () => {
  it('Home: sections, projects in order, meta', async () => {
    const { pages, expected, cfg } = await load();
    render(<MemoryRouter><pages.Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: cfg.STATEMENT_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: cfg.SERVICES_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'All projects' })).toHaveAttribute('id', 'projects');
    expect(screen.getByText(cfg.PROJECTS_SUBTITLE)).toBeInTheDocument();
    expect(expected.map((p) => p.slug)).toEqual(['auto-emailer', 'partner-event-finder']);
    expect(cardHrefs()).toEqual(expected.map((p) => `/projects/${p.slug}`));
    expect(document.body.textContent).not.toMatch(/clip-verse|onolys/i);
    expect(document.title).toBe('Tejit Pabari | Nonprofit AI Consulting');
    expect(desc()).toBe(cfg.ROUTE_META.home.description);
  });

  it('Projects: H1 + list + meta', async () => {
    const { pages, expected, cfg } = await load();
    render(<MemoryRouter><pages.Projects /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(cardHrefs()).toEqual(expected.map((p) => `/projects/${p.slug}`));
    expect(document.title).toBe('Projects | Nonprofit AI Consulting');
    expect(desc()).toBe(cfg.ROUTE_META.projects.description);
  });

  it.each(['loading', 'ok', 'empty', 'error'])('Schedule: heading + intro in state %s', async (state) => {
    const { pages, cfg } = await load();
    hookState.value = { state, items: [], groups: { active: [], done: [] } };
    const { container } = render(<MemoryRouter><pages.Schedule /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: cfg.SCHEDULE_HEADING })).toBeInTheDocument();
    expect(screen.getByText(cfg.SCHEDULE_INTRO)).toBeInTheDocument();
    const unavailable = screen.queryAllByText(cfg.SCHEDULE_UNAVAILABLE).filter((e) => e.closest('noscript') === null);
    expect(unavailable.length).toBe(state === 'empty' || state === 'error' ? 1 : 0);
    expect(container.querySelector('noscript')).not.toBeNull();
    expect(document.title).toBe('Schedule | Nonprofit AI Consulting');
    expect(desc()).toBe(cfg.ROUTE_META.schedule.description);
  });

  it('Schedule: SSR markup has skeleton-state noscript with unavailable message', async () => {
    const { renderToString } = await import('react-dom/server');
    const { pages, cfg } = await load();
    const html = renderToString(<MemoryRouter><pages.Schedule /></MemoryRouter>);
    expect(html).toMatch(/<noscript>.*Schedule unavailable, check back soon.*<\/noscript>/);
    expect(html).toContain(cfg.SCHEDULE_INTRO.replace("'", '&#x27;'));
  });
});
