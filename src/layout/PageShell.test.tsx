import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PageShell } from './PageShell';

function renderShell() {
  const router = createMemoryRouter([{ path: '/', element: <PageShell />, children: [{ index: true, element: <div>content</div> }] }]);
  return render(<RouterProvider router={router} />);
}

describe('PageShell', () => {
  it('lays out a sticky-footer flex column', () => {
    const { container } = renderShell();
    expect(container.querySelector('.flex.min-h-screen.flex-col')).not.toBeNull();
    expect(container.querySelector('main')?.className).toContain('flex-1');
  });

  // Round 3: the "back-only" chrome mode is gone - Nav is always rendered.
  it('always renders Nav and Footer, on every route', () => {
    const { container } = renderShell();
    expect(container.querySelector('nav')).not.toBeNull();
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('Tejit Pabari');
  });
});
