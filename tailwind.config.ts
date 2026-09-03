// tailwind.config.ts
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F1E8',        // primary background
        sage: '#DDE7DE',         // secondary/card background
        teal: {
          DEFAULT: '#043439',    // primary accent
          secondary: '#0F4C45',  // borders, links, labels, icons
        },
        ink: '#162b26',          // primary text
        body: '#3E514D',         // body text
        slate: '#6B7B77',        // tertiary text (lighter)
        'slate-dark': '#4D5D59', // tertiary text (darker)
        placeholder: '#EEF3EE',  // image placeholder background
        'status-building': '#92400E', // NEW — StatusBadge's "in progress" color.
        // Tailwind's own default amber-800 hex, reused deliberately rather
        // than inventing an arbitrary new color: a familiar, well-tested
        // exact value, formally declared as a named brand token here (not
        // referenced as a bare `amber-800` utility class anywhere) so it's
        // tracked in the design system the same way every other color is.
      },
      fontFamily: {
        sans: [
          'Montserrat',
          'ui-sans-serif', 'system-ui', '-apple-system',
          'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '1rem',       // inner media frames
        card: '1.05rem',   // landing project cards
        panel: '1.15rem',  // About/Contact aside panels
        section: '1.25rem',// detail-page content sections
      },
      boxShadow: {
        pill: '0 14px 40px rgba(22,43,38,0.08)',        // nav pill
        panel: '0 16px 34px rgba(22,43,38,0.06)',        // About/Contact aside
        card: '0 14px 28px rgba(22,43,38,0.05)',         // project card default
        'card-hover': '0 18px 34px rgba(22,43,38,0.08)', // project card hover
        section: '0 12px 28px rgba(22,43,38,0.05)',      // detail-page sections
      },
      maxWidth: {
        content: '72rem',
      },
      spacing: {
        // Half-steps used in ContactSection.tsx / Nav.tsx (p-4.5,
        // sm:px-4.5) that Tailwind's default spacing scale skips (it jumps
        // 4 -> 5 with no 4.5). Value follows Tailwind's own linear
        // spacing[n] = n * 0.25rem formula, the same formula that produces
        // the adjacent real defaults 3.5 = .875rem and 5 = 1.25rem.
        '4.5': '1.125rem',
        // ContactSection.tsx also uses leading-6.5, which needs the exact
        // same value in the lineHeight scale below, not this scale, kept
        // here too since spacing and lineHeight share the same 0.25rem-step
        // numbering convention in this design.
        '6.5': '1.625rem',
      },
      lineHeight: {
        // leading-6.5 (ContactSection.tsx:24): Tailwind's default leading
        // scale is integers only. Value follows the same 0.25rem-per-half-
        // step spacing already used by the integer scale: leading-6 =
        // 1.5rem, leading-7 = 1.75rem, so (6 + 0.5) * 0.25rem = 1.625rem.
        '6.5': '1.625rem',
      },
      opacity: {
        // Real bug fixed here (round 3 final pass): Tailwind's default
        // opacity scale (used to resolve the `/NN` modifier on color
        // utilities like `bg-teal/92`) only has multiples of 5. Any `/NN`
        // value outside that scale silently compiles to NO css rule at
        // all — no error, the utility is just dropped — unless it's
        // written with arbitrary-value syntax (`bg-teal/[0.92]`). This bit
        // StatusBadge (`bg-teal/92`, `bg-slate-dark/92`,
        // `bg-status-building/92` — its colored pill background never
        // rendered anywhere on the site) and, it turns out, several other
        // `/NN` modifiers already in use across the design system
        // (`border-*/12`, `/22`, `/28`, `hover:bg-teal-secondary/8`,
        // `bg-cream/97`) that were silently no-ops the same way. Extending
        // the scale with the exact non-standard steps this codebase uses
        // (verified against dist/assets/*.css before and after) fixes all
        // of them at once, the same way the spacing/lineHeight '4.5'/'6.5'
        // extensions above fix their own gaps.
        '8': '0.08',
        '12': '0.12',
        '22': '0.22',
        '28': '0.28',
        '92': '0.92',
        '97': '0.97',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            fontSize: '0.95rem',
            lineHeight: '1.7',
            '--tw-prose-body': '#3E514D',
            '--tw-prose-headings': '#162b26',
            '--tw-prose-lead': '#3E514D',
            '--tw-prose-links': '#0F4C45',
            '--tw-prose-bold': '#162b26',
            '--tw-prose-bullets': '#0F4C45',
            '--tw-prose-quotes': '#162b26',
            '--tw-prose-quote-borders': 'rgba(15,76,69,0.22)',
            '--tw-prose-hr': 'rgba(15,76,69,0.12)',
            '--tw-prose-th-borders': 'rgba(15,76,69,0.22)',
            '--tw-prose-td-borders': 'rgba(15,76,69,0.12)',
            '--tw-prose-code': '#162b26',
            a: { textDecoration: 'none', fontWeight: '500' },
            'a:hover': { textDecoration: 'underline' },

            // Heading ramp — sits below the page's own <h1> (DetailHeader,
            // 1.9rem/2.4rem across breakpoints) since content markdown is
            // expected to start at h2. h1 is still styled here, capped well
            // below the page h1's smallest breakpoint value, purely as a
            // defensive floor in case a content author ever writes one.
            h1: { fontSize: '1.5rem', lineHeight: '1.25', fontWeight: '800', marginTop: '0', marginBottom: '0.75em' },
            h2: { fontSize: '1.28rem', lineHeight: '1.3', fontWeight: '800', marginTop: '2em', marginBottom: '0.65em' },
            h3: { fontSize: '1.08rem', lineHeight: '1.35', fontWeight: '700', marginTop: '1.6em', marginBottom: '0.5em' },
            h4: { fontSize: '0.98rem', fontWeight: '700', marginTop: '1.4em', marginBottom: '0.4em' },
            p: { marginTop: '0', marginBottom: '1.1em' },
            'ul, ol': { marginTop: '0.9em', marginBottom: '1.1em' },
            li: { marginTop: '0.35em', marginBottom: '0.35em' },

            // GFM task lists — keyed on the real classes mdast-util-to-hast
            // actually emits (li.task-list-item / ul.contains-task-list), not
            // `:has()` or a `[data-type="taskList"]` attribute (that's a
            // different, ProseMirror/Tiptap-family convention this toolchain
            // never emits). PRD §4.5.
            'ul.contains-task-list': { paddingInlineStart: '0' },
            'li.task-list-item': { listStyleType: 'none' },
            'li.task-list-item input[type="checkbox"]': {
              marginInlineEnd: '0.6em',
              accentColor: '#0F4C45',
              verticalAlign: 'middle',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
} satisfies Config;
