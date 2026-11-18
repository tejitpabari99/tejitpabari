import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ listIdeas: vi.fn(), getCriteria: vi.fn(), getSettings: vi.fn() }));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../lib/ideas.js', async (orig) => ({ ...(await orig<typeof import('../lib/ideas.js')>()), listIdeas: h.listIdeas }));
vi.mock('../lib/settings.js', () => ({ getSettings: h.getSettings, getCriteria: h.getCriteria }));

import { AuthContext, type Role } from '../auth/auth-context';
import { routes } from '../routes';

function mount(path: string, role: Role, user: unknown) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthContext.Provider value={{ user: user as never, authReady: true, role }}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe.each(['/settings', '/ideas/rank'])('%s gate', (path) => {
  it.each([
    ['guest', null],
    ['non-owner', { email: 'stranger@example.com', emailVerified: true }],
  ])('%s sees the sign-in gate, not the page, and nothing is queried', async (_n, user) => {
    h.getSettings.mockResolvedValue({ guestVisibility: { '/': true, '/ideas': true, '/links': true } });
    h.listIdeas.mockClear();
    h.getCriteria.mockClear();
    mount(path, 'guest', user);
    expect(await screen.findByText('admin.tejitpabari.com', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Settings|Rank Ideas/ })).toBeNull();
    expect(h.listIdeas).not.toHaveBeenCalled();
    expect(h.getCriteria).not.toHaveBeenCalled();
  });
});
