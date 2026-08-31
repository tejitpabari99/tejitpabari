import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const paths = [
  '/', '/projects', '/projects/anything', '/projects/anything/live',
  '/work-experience', '/research', '/research/anything', '/privacy', '/terms',
  '/this-does-not-exist',
];

describe('route tree smoke test', () => {
  it.each(paths)('renders %s without throwing', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    expect(() => render(<RouterProvider router={router} />)).not.toThrow();
  });
});
