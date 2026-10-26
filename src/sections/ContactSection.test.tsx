import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactSection } from './ContactSection';

const contactMailto = vi.hoisted(() => ({ href: null as string | null }));

// RTL's render is wrapped in act(), which flushes passive effects before it
// returns in the React version used by this project. Control the hook's value
// to inspect ContactSection's pre- and post-mount branches deterministically;
// the real hook timing is covered by src/hooks/useContactMailto.test.ts.
vi.mock('@/hooks/useContactMailto', () => ({
  useContactMailto: () => contactMailto.href,
}));

describe('ContactSection', () => {
  it('renders an always-present "Email Me" button before the mailto effect settles, then upgrades to a real mailto: link', async () => {
    contactMailto.href = null;
    const view = render(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );

    // Before the hook supplies a client-only href (this is also byte-
    // identical to the prerendered/SSR HTML and the no-JS state), an
    // "Email Me" affordance is always present. It's a real <button> here
    // (not a link, since there is no href to offer yet), never the raw
    // obfuscated address literal.
    const button = screen.getByRole('button', { name: 'Email Me' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Email Me' })).toBeNull();

    // Once useContactMailto's effect settles, ContactSection upgrades the
    // same affordance to a real mailto: <a> so middle-click / "copy link
    // address" work for real users.
    contactMailto.href = 'mailto:tejitpabari99@gmail.com';
    view.rerender(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Email Me' })).toHaveAttribute(
        'href',
        'mailto:tejitpabari99@gmail.com',
      );
    });
    expect(screen.queryByRole('button', { name: 'Email Me' })).toBeNull();
  });

  it('never renders a plain, contiguous user@domain email literal in the markup', () => {
    contactMailto.href = null;
    const { container } = render(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );
    expect(container.innerHTML).not.toMatch(/tejitpabari99@gmail\.com/);
    expect(container.innerHTML).not.toMatch(/tejitpabari99\s*_at_\s*gmail/);
  });

  it('assembles the address and navigates on click of the pre-hydration button', () => {
    contactMailto.href = null;
    render(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );

    const originalHref = window.location.href;
    // jsdom throws "Not implemented: navigation" on a real assignment to
    // window.location.href; stub it out for this one assertion so the click
    // handler's assignment can be observed without jsdom's navigation noise.
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, set href(value: string) {
        hrefSetter(value);
      } },
    });

    screen.getByRole('button', { name: 'Email Me' }).click();
    expect(hrefSetter).toHaveBeenCalledWith('mailto:tejitpabari99@gmail.com');

    // Restore, so this test doesn't leak a stubbed window.location into
    // other tests in the file/run.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, href: originalHref },
    });
  });
});
