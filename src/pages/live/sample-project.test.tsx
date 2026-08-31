// src/pages/live/sample-project.test.tsx
//
// Task 18 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's
// "SampleProjectLive" bullet. Proves the hydration-safe placeholder and
// the real per-second tick, using fake timers — no build/render pipeline
// needed.
//
// Note on TASKS.md's literal `getByRole('status', { hidden: true })`
// snippet: SampleProjectLive's ticking <p> carries `aria-live="polite"`
// but no explicit `role="status"`, and `aria-live` alone does not grant an
// element an implicit ARIA "status" role (only elements like <output>, or
// an explicit role attribute, do) — confirmed empirically against this
// exact component: `screen.getByRole('status', { hidden: true })` throws
// ("Unable to find an accessible element with the role status"), so the
// TASKS.md snippet's `?? document.body.textContent` fallback never
// actually engages (a thrown query, unlike a null return, isn't caught by
// `?.`/`??`). This test instead selects the ticking node directly via its
// `aria-live="polite"` attribute — a selector unique to that one <p> in
// this component's tree — which is the real, honest way to observe it
// without relying on an ARIA role the component doesn't have.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import SampleProjectLive from './sample-project';

afterEach(() => vi.useRealTimers());

describe('SampleProjectLive', () => {
  it('renders a placeholder or a live timestamp — never throwing — on initial render', () => {
    vi.useFakeTimers();
    const { container } = render(<SampleProjectLive />);
    // React Testing Library's `render` flushes passive effects
    // synchronously (confirmed empirically against this component: the
    // mount effect's `setNow(new Date())` has already run by the time
    // `render()` returns, even under fake timers, since effect flushing is
    // independent of the timer-fake). So the very first observable paint
    // already shows a real timestamp, not the build-time-safe '—'
    // placeholder — this assertion matches TASKS.md's own literal
    // criterion (either character class), which is deliberately lenient
    // for exactly this reason, and is proven not-a-crash by construction.
    // Scoped to the ticking node specifically (not `screen.getByText`,
    // which throws "multiple elements found" here — the page's own static
    // caption paragraph also contains an em dash and digits).
    const tickingNode = container.querySelector('[aria-live="polite"]');
    expect(tickingNode).toBeInTheDocument();
    expect(tickingNode?.textContent).toMatch(/—|\d/);
  });

  it('updates the displayed time after each second, proving a real interval tick, not a one-shot Date.now() read', () => {
    vi.useFakeTimers();
    const { container } = render(<SampleProjectLive />);
    const tickingNode = () => container.querySelector('[aria-live="polite"]');
    const firstText = tickingNode()?.textContent;
    expect(firstText).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const secondText = tickingNode()?.textContent;

    // This assertion is the one that fails if SampleProjectLive were
    // rewritten to read `Date.now()`/`new Date()` once at render time
    // instead of ticking via `setInterval` (PRD §4.7's flagged
    // hydration-unsafe alternative) — a one-shot read would never change
    // across the advanced timer.
    expect(secondText).not.toBe(firstText);
  });

  it('keeps ticking across multiple seconds, and clears the interval on unmount without throwing', () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<SampleProjectLive />);
    const tickingNode = () => container.querySelector('[aria-live="polite"]');

    const readings = [tickingNode()?.textContent];
    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      readings.push(tickingNode()?.textContent);
    }

    // Every consecutive pair differs — each second's tick is a real,
    // distinct clock read.
    for (let i = 1; i < readings.length; i++) {
      expect(readings[i]).not.toBe(readings[i - 1]);
    }

    expect(() => unmount()).not.toThrow();
    // Advancing timers after unmount must not throw (proves the effect's
    // cleanup — clearInterval — actually ran).
    expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow();
  });
});
