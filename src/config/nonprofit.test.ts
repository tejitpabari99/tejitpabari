import { describe, it, expect, expectTypeOf } from 'vitest';
import * as cfg from './nonprofit';
import { trackEvent, type AnalyticsEventName } from '../lib/analytics';

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

describe('nonprofit config', () => {
  it('has 3 services in order', () => {
    expect(cfg.SERVICES.map((s) => s.slug)).toEqual([
      'ai-evaluation',
      'automation-ai-workflows',
      'ai-adoption',
    ]);
    expect(cfg.SERVICES.map((s) => s.title)).toEqual([
      'AI evaluation',
      'Automation & AI workflows',
      'AI Adoption and Policy',
    ]);
  });

  it('has services heading and projects subtitle', () => {
    expect(cfg.SERVICES_HEADING).toBe('What Services do I provide');
    expect(cfg.PROJECTS_SUBTITLE).toBe('Check out my active projects used by Non Profits');
  });

  it('has no em dash in any exported string', () => {
    const strings = allStrings({ ...cfg });
    expect(strings.length).toBeGreaterThan(10);
    for (const s of strings) expect(s).not.toContain('—');
  });

  it('exposes booking and CSV URLs', () => {
    expect(cfg.BOOKING_URL).toBe('https://go.tejitpabari.com/meet-ngo');
    expect(cfg.NONPROFIT_SCHEDULE_CSV_URL).toBe(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdHGSY4cKp-FFggDBhAkUqhNSSRRdn-MyBJFg170EUUssuupWVItLHs7JxbdvMN5QMWatrxwmeQNJN/pub?gid=779051931&single=true&output=csv',
    );
  });

  it('has hero copy', () => {
    expect(cfg.HERO_EYEBROW).toBe('Nonprofit AI Consulting');
    expect(cfg.HERO_HEADING).toBe('Tejit Pabari');
    expect(cfg.HERO_TEXT.startsWith("I audit a nonprofit organization's work")).toBe(true);
    expect(cfg.HERO_TEXT.endsWith('Free consultations, no obligation.')).toBe(true);
    expect(cfg.STATEMENT_HEADING).toBe('What is a consultation');
  });

  it('maps statuses case-insensitively, unknown to To do', () => {
    const m = cfg.mapStatus;
    expect(m('In progress')).toBe('In progress');
    expect(m(' in review ')).toBe('In progress');
    expect(m('WAITING')).toBe('In progress');
    expect(m('To do')).toBe('To do');
    expect(m('done')).toBe('Done');
    expect(m('whatever')).toBe('To do');
    expect(m('')).toBe('To do');
  });

  it('has status color pairs', () => {
    expect(cfg.STATUS_COLORS).toEqual({
      Done: 'bg-green-100 text-green-900',
      'In progress': 'bg-blue-100 text-blue-900',
      'To do': 'bg-gray-100 text-gray-800',
    });
  });

  it('has route meta for 3 pages', () => {
    expect(cfg.ROUTE_META.home.title).toBe('Tejit Pabari | Nonprofit AI Consulting');
    expect(cfg.ROUTE_META.projects.title).toBe('Projects | Nonprofit AI Consulting');
    expect(cfg.ROUTE_META.schedule.title).toBe('Schedule | Nonprofit AI Consulting');
    expect(cfg.ROUTE_META.home.description.length).toBeLessThan(160);
  });
});

describe('new analytics events', () => {
  it('are accepted by trackEvent types', () => {
    expectTypeOf<'book_consultation_click'>().toExtend<AnalyticsEventName>();
    expectTypeOf<'schedule_load'>().toExtend<AnalyticsEventName>();
    expect(() => {
      trackEvent('book_consultation_click', { source: 'hero' });
      trackEvent('schedule_load', { state: 'ok', row_count: 3 });
    }).not.toThrow();
  });
});
