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
    },
  },
  plugins: [typography],
} satisfies Config;
