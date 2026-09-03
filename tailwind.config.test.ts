// tailwind.config.test.ts
//
// Regression test for a real bug (round 3 final pass): Tailwind's default
// opacity scale only has multiples of 5, so any `/NN` color-opacity
// modifier used in source with an off-scale value (e.g. `bg-teal/92`)
// silently compiles to NO css rule at all, with no build error — this is
// exactly what made StatusBadge's colored pill background never render
// anywhere on the site (`bg-teal/92`, `bg-slate-dark/92`,
// `bg-status-building/92`), plus several other `/NN` modifiers already in
// use elsewhere (`border-*/12`, `/22`, `/28`, `hover:bg-teal-secondary/8`,
// `bg-cream/97`).
//
// This test can't run the real Tailwind/PostCSS pipeline (that's what
// `dist/assets/*.css` grep checks in the manual verification below are
// for), but it can assert, cheaply and on every CI run, that the config's
// `theme.extend.opacity` scale still contains every non-multiple-of-5 step
// this codebase's `className`s actually use — so a future edit that
// removes or renames one of these keys fails a fast unit test instead of
// silently reintroducing an invisible-background bug.
import { describe, expect, it } from 'vitest';
import tailwindConfig from './tailwind.config';

describe('tailwind.config.ts opacity scale', () => {
  const opacity = tailwindConfig.theme?.extend?.opacity as Record<string, string> | undefined;

  it('extends the default (multiples-of-5-only) opacity scale', () => {
    expect(opacity).toBeDefined();
  });

  // Every one of these is used as a `/NN` color-opacity modifier somewhere
  // in src/ today (StatusBadge's bg-teal/92, bg-slate-dark/92,
  // bg-status-building/92; TagPill/ProjectCard/TimelineEntry's
  // border-*/12, /22, /28; Nav/ConsentBanner/PrivacyPage's
  // hover:bg-teal-secondary/8; ConsentBanner's bg-cream/97) and none of
  // them is a multiple of 5, so none would generate real CSS without an
  // explicit entry here.
  it.each(['8', '12', '22', '28', '92', '97'])(
    'includes opacity step "%s" (used by a real /%s modifier in src/)',
    (step) => {
      expect(opacity?.[step]).toBeDefined();
      expect(Number(opacity?.[step])).toBeCloseTo(Number(step) / 100, 5);
    },
  );
});
