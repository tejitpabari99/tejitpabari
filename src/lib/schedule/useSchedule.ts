import { useEffect, useMemo, useState } from 'react';
import { NONPROFIT_SCHEDULE_CSV_URL } from '../../config/nonprofit';
import { trackEvent } from '../analytics';
import { parseCsv } from './parseCsv';
import { groupSchedule, toScheduleItems, type ScheduleGroups, type ScheduleItem } from './schedule';

export type ScheduleState = 'loading' | 'ok' | 'empty' | 'error';

const TIMEOUT_MS = 10_000;
const EMPTY_GROUPS: ScheduleGroups = { active: [], done: [] };

/**
 * Client-only fetch of the published sheet CSV. 'empty' (no rows) and 'error'
 * both render the single "Schedule unavailable" message on the page.
 */
export function useSchedule(): { state: ScheduleState; items: ScheduleItem[]; groups: ScheduleGroups } {
  const [state, setState] = useState<ScheduleState>('loading');
  const [items, setItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let unmounted = false;
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const finish = (next: ScheduleState, rows: ScheduleItem[]) => {
      if (unmounted) return;
      setItems(rows);
      setState(next);
      if (next !== 'loading') trackEvent('schedule_load', { state: next, row_count: rows.length });
    };

    (async () => {
      try {
        const res = await fetch(NONPROFIT_SCHEDULE_CSV_URL, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = toScheduleItems(parseCsv(text));
        finish(rows.length === 0 ? 'empty' : 'ok', rows);
      } catch {
        finish('error', []);
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      unmounted = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const groups = useMemo(() => (items.length ? groupSchedule(items) : EMPTY_GROUPS), [items]);
  return { state, items, groups };
}
