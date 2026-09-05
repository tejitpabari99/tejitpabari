import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPage } from './PrivacyPage';
import { useConsent } from '@/context/ConsentContext';
import { useContactMailto } from '@/hooks/useContactMailto';

// PrivacyPage calls useConsent() directly (for the consent-status copy and
// the "Clear my choice" button) and useContactMailto() (for the obfuscated
// Contact section) — mock both so this test controls their return values
// without needing real localStorage/effect timing.
vi.mock('@/context/ConsentContext', () => ({
  ConsentProvider: ({ children }: { children: ReactNode }) => children,
  useConsent: vi.fn(),
}));

vi.mock('@/hooks/useContactMailto', () => ({
  useContactMailto: vi.fn(),
}));

// Every top-level <h2> heading named in Task 12's acceptance criterion 3,
// in the order it lists them (the page also renders a "Your consent
// choice" heading between "What this site does collect" and "Cookies, in
// full" that criterion 3 doesn't name — this list is a subsequence check,
// not an exhaustive one, matching Task 19's literal instruction).
const EXPECTED_HEADINGS = [
  'The short version',
  'What this covers',
  'What this site does not do',
  'What this site does collect',
  'Cookies, in full',
  'Outbound links',
  'Children',
  'Changes to this policy',
  'Contact',
];

function renderPrivacyPage() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  );
}

describe('PrivacyPage', () => {
  let clearConsentMock: () => void;

  beforeEach(() => {
    clearConsentMock = vi.fn();
    vi.mocked(useConsent).mockReturnValue({
      consent: 'unset',
      hydrated: true,
      grant: vi.fn(),
      decline: vi.fn(),
      clearConsent: clearConsentMock,
    });
    // Simulates the build-time / pre-hydration render, where the real
    // mailto: href never exists.
    vi.mocked(useContactMailto).mockReturnValue(null);
  });

  it('renders without throwing', () => {
    expect(() => renderPrivacyPage()).not.toThrow();
  });

  it('renders every heading from Task 12 acceptance criterion 3, in order', () => {
    renderPrivacyPage();
    const allHeadings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const filtered = allHeadings.filter((text) => EXPECTED_HEADINGS.includes(text ?? ''));
    expect(filtered).toEqual(EXPECTED_HEADINGS);
  });

  // Coverage-audit addendum (folded into gap E's commit): the heading list
  // above only proves the section exists, not that its body copy still
  // states the substantive "no forms" claim check-no-forms.sh's shipped
  // behavior backs (scripts/check-no-forms.test.ts). Assert the actual
  // sentence, so the copy can't silently drift out from under that script.
  it('the "What this site does not do" section body actually states there are no forms', () => {
    renderPrivacyPage();
    const heading = screen.getByRole('heading', { level: 2, name: 'What this site does not do' });
    expect(heading.parentElement?.textContent).toContain(
      'No forms of any kind, anywhere on the domain, as of the date above',
    );
  });

  it('with consent unset, "Clear my choice" is not rendered and the status says there is nothing to clear', () => {
    renderPrivacyPage();
    expect(screen.queryByRole('button', { name: 'Clear my choice' })).toBeNull();
    expect(screen.getByText(/There is nothing to clear yet/)).toBeInTheDocument();
  });

  it('with consent granted, "Clear my choice" calls the mocked clearConsent() and shows the Cleared confirmation', () => {
    vi.mocked(useConsent).mockReturnValue({
      consent: 'granted',
      hydrated: true,
      grant: vi.fn(),
      decline: vi.fn(),
      clearConsent: clearConsentMock,
    });
    renderPrivacyPage();
    fireEvent.click(screen.getByRole('button', { name: 'Clear my choice' }));
    expect(clearConsentMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Cleared.');
  });

  it('never renders a literal mailto: string or the bare email address when useContactMailto is mocked to return null', () => {
    const { container } = renderPrivacyPage();
    expect(container.textContent).not.toContain('mailto:tejitpabari99@gmail.com');
    expect(container.textContent).not.toContain('tejitpabari99@gmail.com');
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    // The obfuscated display text is the only thing that should appear.
    expect(container.textContent).toContain('tejitpabari99 _at_ gmail [dot] com');
  });

  it('reflects the page title and description in the rendered output via RouteMeta', () => {
    // The globally-mocked `<Head>` (see src/setupTests.ts) renders its
    // children as plain elements. React 19 then auto-hoists <title>/<meta>
    // to document.head regardless of where in the tree they were rendered
    // (confirmed by inspection — they never appear inside the render
    // container itself), so this is the real, honest place to assert the
    // exact title/description strings passed into RouteMeta. The rendered
    // title carries RouteMeta's " · Tejit Pabari" site-name suffix
    // (src/components/RouteMeta.tsx) on top of the bare page title passed
    // in below.
    renderPrivacyPage();
    const title = document.head.querySelector('title');
    expect(title?.textContent).toBe('Privacy Policy · Tejit Pabari');
    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe(
      "This is Tejit Pabari's personal portfolio: no company, no accounts, and no forms today. " +
        'Here is what this site, and everything hosted under it, collects, and what your choices are.',
    );
  });
});
