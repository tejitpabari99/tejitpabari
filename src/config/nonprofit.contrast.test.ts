// WCAG 2.x contrast check for the nonprofit schedule status badges.
// Colors resolve from Tailwind's default palette (tailwindcss 3.4.x, hex values,
// via `tailwindcss/colors`); tailwind.config.ts only extends custom colors and
// does not override green/blue/gray.
import { describe, expect, it } from 'vitest';
import colors from 'tailwindcss/colors';
import { SERVICE_CARD_STYLES, STATUS_COLORS } from './nonprofit';

const palette = colors as unknown as Record<string, Record<string, string>>;

function resolve(cls: string): string {
  const m = /^(?:bg|text)-([a-z]+)-(\d+)$/.exec(cls);
  if (!m) throw new Error(`unsupported class ${cls}`);
  const hex = palette[m[1]]?.[m[2]];
  if (!hex) throw new Error(`unknown color ${cls}`);
  return hex;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('nonprofit STATUS_COLORS contrast', () => {
  it('uses the expected token pairs', () => {
    expect(Object.values(STATUS_COLORS).sort()).toEqual([
      'bg-blue-100 text-blue-900',
      'bg-gray-100 text-gray-800',
      'bg-green-100 text-green-900',
    ]);
  });

  for (const [status, classes] of Object.entries(STATUS_COLORS)) {
    it(`${status} meets WCAG AA (>= 4.5:1)`, () => {
      const bg = classes.split(' ').find((c) => c.startsWith('bg-'))!;
      const fg = classes.split(' ').find((c) => c.startsWith('text-'))!;
      const ratio = contrast(resolve(bg), resolve(fg));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('service card contrast', () => {
  // ink / body text colors from tailwind.config.ts
  const text = { ink: '#162b26', body: '#3E514D' };
  for (const st of SERVICE_CARD_STYLES) {
    for (const [name, fg] of Object.entries(text)) {
      it(`${st.bg} with ${name} text >= 4.5:1`, () => {
        expect(contrast(resolve(st.bg), fg)).toBeGreaterThanOrEqual(4.5);
      });
    }
    it(`${st.badge} >= 4.5:1`, () => {
      const [bg, fg] = st.badge.split(' ');
      expect(contrast(resolve(bg), resolve(fg))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
