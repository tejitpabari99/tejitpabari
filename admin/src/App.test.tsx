import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ cb: null as null | ((u: unknown) => void) }));
vi.mock('./lib/firebase.js', () => ({ auth: {} }));
vi.mock('firebase/auth', async (orig) => ({
  ...(await orig<typeof import('firebase/auth')>()),
  onAuthStateChanged: (_a: unknown, fn: (u: unknown) => void) => {
    h.cb = fn;
    return vi.fn();
  },
}));
vi.mock('./lib/settings.js', () => ({ getSettings: async () => ({ guestVisibility: { '/': true } }) }));

import { AuthProvider } from './auth/AuthProvider';
import { routes } from './routes';

describe('admin app root', () => {
  it('renders the layout and the home page at /', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );
    expect(screen.getByText('admin.tejitpabari.com')).toBeInTheDocument();
    await act(async () => h.cb!(null));
    expect(await screen.findByTestId('page')).toHaveTextContent('Home');
  });
});
