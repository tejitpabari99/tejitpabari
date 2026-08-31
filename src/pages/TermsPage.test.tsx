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

  it('never renders a literal mailto: string or the bare email address when useContactMailto is mocked to return null', () => {
    const { container } = renderTermsPage();
    expect(container.textContent).not.toContain('mailto:tejitpabari99@gmail.com');
    expect(container.textContent).not.toContain('tejitpabari99@gmail.com');
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    // The obfuscated display text is the only thing that should appear.
    expect(container.textContent).toContain('tejitpabari99 _at_ gmail [dot] com');
  });

  it('reflects the page title and description in the rendered output (RouteMeta not yet available — SP06)', () => {
    // The globally-mocked `<Head>` (see src/setupTests.ts) renders its
    // children as plain elements. React 19 then auto-hoists <title>/<meta>
    // to document.head regardless of where in the tree they were rendered
    // (confirmed by inspection — they never appear inside the render
    // container itself), so this is the real, honest place to assert the
    // exact title/description strings RouteMeta would have received.
    renderTermsPage();
    const title = document.head.querySelector('title');
    expect(title?.textContent).toBe('Terms of Use');
    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe(
      'Terms governing use of tejitpabari.com, a personal portfolio — no company, no warranty, and how hosted projects and outbound links are treated.',
    );
  });
});
