// Site-aware slug lookup (03-healthtech-site Task 2). SITE is read at module
// load, so each case stubs VITE_SITE, resets modules and imports dynamically.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

async function renderFor(site: string, slug: string) {
  vi.stubEnv('VITE_SITE', site);
  vi.resetModules();
  const { ProjectDetailPage } = await import('./ProjectDetailPage');
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes><Route path="/projects/:slug" element={<ProjectDetailPage />} /></Routes>
    </MemoryRouter>,
  );
}

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('ProjectDetailPage site lookup', () => {
  it('renders a healthtech slug under SITE=healthtech, with no /live href', async () => {
    const { container, getByRole, queryByText } = await renderFor('healthtech', 'onolys');
    expect(getByRole('heading', { level: 1, name: /onolys/i })).toBeInTheDocument();
    expect(queryByText('Page not found')).toBeNull();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.filter((h) => /\/live/.test(h))).toEqual([]);
  });

  it('renders NotFoundPage for a main-only slug under SITE=healthtech', async () => {
    const { getByText } = await renderFor('healthtech', 'clip-verse');
    expect(getByText('Page not found')).toBeInTheDocument();
  });

  it('still renders clip-verse under SITE=main', async () => {
    const { queryByText } = await renderFor('main', 'clip-verse');
    expect(queryByText('Page not found')).toBeNull();
  });
});
