import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AccessContext } from './auth/access-context';
import { AuthContext, type Role } from './auth/auth-context';

// Renders a page as if it passed the gate, with a fixed role (data layer is mocked per test).
export function renderPage(ui: ReactElement, role: Role, path = '/') {
  const user = role === 'admin' ? ({ email: 'tejitpabari99@gmail.com', emailVerified: true } as never) : null;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ user, authReady: true, role }}>
        <AccessContext.Provider value={{ allowed: true, guestVisibility: {} }}>{ui}</AccessContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
