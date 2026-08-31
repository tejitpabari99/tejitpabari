import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TermsPage } from './TermsPage';
import { useContactMailto } from '@/hooks/useContactMailto';

// TermsPage doesn't use useConsent — only useContactMailto, for its
// obfuscated Contact section.
vi.mock('@/hooks/useContactMailto', () => ({
  useContactMailto: vi.fn(),
}));

// Every <h2> heading from Task 13's acceptance criteria, in order — this is
// the page's complete set of top-level headings (unlike Privacy, there's no
// extra heading not named by the task).
const EXPECTED_HEADINGS = [
  "This isn't professional or medical advice",
  'What this covers',
  'No forms, today',
  'No warranty',
  'Individual projects may carry their own licence',
  'Links to other sites aren\'t endorsements',
  'My views are my own',
  'Changes',
  'Contact',
];

function renderTermsPage() {
  return render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>,
  );
}

describe('TermsPage', () => {
  beforeEach(() => {
    // Simulates the build-time / pre-hydration render, where the real
    // mailto: href never exists.
    vi.mocked(useContactMailto).mockReturnValue(null);
  });

  it('renders without throwing', () => {
    expect(() => renderTermsPage()).not.toThrow();
  });

  it('renders every heading from Task 13 acceptance criteria, in order, and no "Governing Law" heading', () => {
    renderTermsPage();
    const allHeadings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(allHeadings).toEqual(EXPECTED_HEADINGS);
    expect(allHeadings).not.toContain('Governing Law');
  });

  // Coverage-audit addendum (folded into gap E's commit): the heading list
  // above only proves the section exists, not that its body copy still
  // states the substantive "no forms" claim check-no-forms.sh's shipped
  // behavior backs (scripts/check-no-forms.test.ts). Assert the actual
  // sentence, so the copy can't silently drift out from under that script.
  it('the "No forms, today" section body actually states there are no forms', () => {
    renderTermsPage();
    const heading = screen.getByRole('heading', { level: 2, name: 'No forms, today' });
    expect(heading.parentElement?.textContent).toContain(
      'this site has no forms, accounts, or logins anywhere, and',
    );
  });

  it('never renders a literal mailto: string or the bare email address when useContactMailto is mocked to return null', () => {
    const { container } = renderTermsPage();
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
    renderTermsPage();
    const title = document.head.querySelector('title');
    expect(title?.textContent).toBe('Terms of Use · Tejit Pabari');
    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe(
      'Terms governing use of tejitpabari.com, a personal portfolio — no company, no warranty, and how hosted projects and outbound links are treated.',
    );
  });
});
