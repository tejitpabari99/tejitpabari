import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactSection } from './ContactSection';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';

const contactMailto = vi.hoisted(() => ({ href: null as string | null }));

// RTL's render is wrapped in act(), which flushes passive effects before it
// returns in the React version used by this project. Control the hook's value
// to inspect ContactSection's pre- and post-mount branches deterministically;
// the real hook timing is covered by src/hooks/useContactMailto.test.ts.
vi.mock('@/hooks/useContactMailto', () => ({
  useContactMailto: () => contactMailto.href,
}));

describe('ContactSection', () => {
  it('shows the obfuscated text before the mailto effect settles, then exposes the mailto affordances', async () => {
    const view = render(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );

    // Before the hook supplies a client-only href, both display nodes remain
    // plain text so prerendered HTML cannot contain a mailto href.
    const initialNodes = screen.getAllByText(CONTACT_EMAIL_DISPLAY);
    expect(initialNodes).toHaveLength(2);
    for (const node of initialNodes) {
      expect(node.closest('a')).toBeNull();
    }

    // Once useContactMailto's effect settles, rerender with its resulting
    // value. Verify the primary affordance by its label/href and the aside by
    // its obfuscated display text.
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
      const asideEmail = screen.getAllByText(CONTACT_EMAIL_DISPLAY).find((node) => node.closest('a'));
      expect(asideEmail?.closest('a')).toHaveAttribute('href', 'mailto:tejitpabari99@gmail.com');
    });
  });
});
