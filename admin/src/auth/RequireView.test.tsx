import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  cb: null as null | ((u: unknown) => void),
  getSettings: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  loader: vi.fn(),
}));

vi.mock('../lib/firebase.js', () => ({ auth: {} }));
vi.mock('firebase/auth', async (orig) => ({
  ...(await orig<typeof import('firebase/auth')>()),
  onAuthStateChanged: (_a: unknown, fn: (u: unknown) => void) => {
    h.cb = fn;
    return vi.fn();
  },
  signInWithPopup: h.signInWithPopup,
  signOut: h.signOut,
}));
vi.mock('../lib/settings.js', () => ({ getSettings: h.getSettings }));

import { AuthProvider } from './AuthProvider';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import { useLoader } from '../hooks/useLoader';

const ADMIN = { email: 'tejitpabari99@gmail.com', emailVerified: true };
const STRANGER = { email: 'stranger@example.com', emailVerified: true };

function Page({ name }: { name: string }) {
  const { data } = useLoader(async () => {
    h.loader(name);
    return name;
  }, [name]);
  return <p data-testid="page">{`page:${name}:${data ?? ''}`}</p>;
}

const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Page name="home" /> },
      { path: '/links', element: <Page name="links" /> },
      { path: '/settings', element: <Page name="settings" /> },
      { path: '/ideas/rank', element: <Page name="rank" /> },
      { path: '/login', element: <Login /> },
    ],
  },
];

function mount(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}
const fire = (u: unknown) => act(async () => h.cb!(u));

beforeEach(() => {
  h.cb = null;
  h.loader.mockReset();
  h.signInWithPopup.mockReset();
  h.signOut.mockReset();
  h.getSettings.mockReset();
  h.getSettings.mockResolvedValue({ guestVisibility: { '/': true, '/ideas': true } });
});

describe('RequireView gate', () => {
  it('renders nothing role-dependent before authReady', async () => {
    mount('/links');
    expect(screen.queryByTestId('page')).toBeNull();
    expect(screen.queryByText('Admin')).toBeNull();
    expect(screen.queryByText('Logout')).toBeNull();
    expect(screen.queryByText('Sign in with Google')).toBeNull();
    expect(h.getSettings).not.toHaveBeenCalled();
    expect(h.loader).not.toHaveBeenCalled();
  });

  it('guest on a hidden page sees the gate and the loader never runs', async () => {
    mount('/links');
    await fire(null);
    expect(await screen.findByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.queryByTestId('page')).toBeNull();
    expect(h.loader).not.toHaveBeenCalled();
  });

  it.each(['/settings', '/ideas/rank'])('guest on admin-only %s sees the gate', async (p) => {
    h.getSettings.mockResolvedValue({ guestVisibility: { '/': true, '/ideas': true, '/links': true, '/settings': true } });
    mount(p);
    await fire(null);
    expect(await screen.findByText('Sign in with Google')).toBeInTheDocument();
    expect(h.loader).not.toHaveBeenCalled();
  });

  it('guest on a visible page sees the page', async () => {
    mount('/');
    await fire(null);
    expect(await screen.findByTestId('page')).toHaveTextContent('page:home');
    expect(h.loader).toHaveBeenCalledWith('home');
  });

  it('admin sees admin-only pages', async () => {
    mount('/settings');
    await fire(ADMIN);
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('page:settings'));
    expect(h.loader).toHaveBeenCalledWith('settings');
  });

  it('non-owner Google user sees "not authorised" and can sign out', async () => {
    mount('/settings');
    await fire(STRANGER);
    expect(await screen.findByText(/stranger@example.com \(not authorised\)/)).toBeInTheDocument();
    expect(h.loader).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(h.signOut).toHaveBeenCalled();
  });

  it('sign-in re-renders the gate into the page without a reload', async () => {
    mount('/settings');
    await fire(null);
    expect(await screen.findByText('Sign in with Google')).toBeInTheDocument();
    await fire(ADMIN);
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('page:settings'));
  });

  it('gate sign-in button calls popup sign-in; popup-closed is ignored, other errors shown', async () => {
    mount('/links');
    await fire(null);
    h.signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => expect(h.signInWithPopup).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
    h.signInWithPopup.mockRejectedValueOnce({ message: 'boom' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});

describe('header', () => {
  it('guest sees an Admin link to /login and no Logout', async () => {
    mount('/');
    await fire(null);
    expect(await screen.findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Logout')).toBeNull();
  });

  it('admin sees settings cog and Logout', async () => {
    mount('/');
    await fire(ADMIN);
    expect(await screen.findByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(h.signOut).toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });
});

describe('/login', () => {
  it('shows the Google button to a guest', async () => {
    mount('/login');
    await fire(null);
    expect(await screen.findByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('returns to / once admin', async () => {
    const router = mount('/login');
    await fire(null);
    await screen.findByRole('button', { name: 'Sign in with Google' });
    await fire(ADMIN);
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
