import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PageShell } from './PageShell';
import type { RouteHandle } from './chromeMode';

function renderShell(handle?: RouteHandle) {
  const router = createMemoryRouter([{ path: '/', element: <PageShell />, children: [{ index: true, element: <div>content</div>, handle }] }]);
  return render(<RouterProvider router={router} />);
}

describe('PageShell', () => {
  it('lays out a sticky-footer flex column', () => {
    const { container } = renderShell();
    expect(container.querySelector('.flex.min-h-screen.flex-col')).not.toBeNull();
    expect(container.querySelector('main')?.className).toContain('flex-1');
  });
  it('still renders Footer when the leaf route is back-only chrome (only Nav is conditional)', () => {
    const { container } = renderShell({ chrome: 'back-only' });
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('Tejit Pabari');
  });
});
