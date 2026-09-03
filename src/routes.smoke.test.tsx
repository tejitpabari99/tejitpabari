import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const paths = [
  '/', '/projects', '/projects/anything',
  '/work-experience', '/research', '/research/anything', '/privacy', '/terms',
  '/this-does-not-exist',
];

const BACK_ONLY_PATHS = ['/projects', '/projects/anything'];

class NoopIntersectionObserver {
  observe() {}

  disconnect() {}
}

describe('route tree smoke test', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(paths)('renders %s without throwing', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    expect(() => render(<RouterProvider router={router} />)).not.toThrow();
  });

  it.each(paths)('shows the navbar on %s only when chrome mode is full', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
    const nav = screen.queryByRole('navigation', { name: 'Primary' });
    if (BACK_ONLY_PATHS.includes(path)) {
      expect(nav).toBeNull();
    } else {
      expect(nav).not.toBeNull();
    }
  });
});
