import { mapStatus, type ScheduleStatus } from '../../config/nonprofit';

/** Only these five fields ever leave the mapping step. */
export interface ScheduleItem {
  name: string;
  project: string;
  blurb: string;
  dateAdded: string;
  status: ScheduleStatus;
}

export interface ScheduleGroups {
  active: ScheduleItem[];
  done: ScheduleItem[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses `YYYY-MM-DD` or `M/D/YYYY` by string split (no Date, no tz drift). */
function parseDate(raw: string): { y: number; m: number; d: number } | null {
  const s = raw.trim();
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]];
  else if (us) [m, d, y] = [+us[1], +us[2], +us[3]];
  else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

export function formatDateLabel(raw: string): string {
  const p = parseDate(raw);
  return p ? `${MONTHS[p.m - 1]} ${p.y}` : '';
}

export function toScheduleItems(rows: string[][]): ScheduleItem[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col('name'),
    project: col('project'),
    blurb: col('public blurb'),
    dateAdded: col('date added'),
    status: col('status'),
  };
  if (idx.project < 0 || idx.status < 0 || idx.dateAdded < 0) {
    throw new Error('Schedule CSV is missing a required column');
  }
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  const items: ScheduleItem[] = [];
  for (const r of rows.slice(1)) {
    const project = get(r, idx.project);
    if (!project) continue;
    items.push({
      name: get(r, idx.name),
      project,
      blurb: get(r, idx.blurb),
      dateAdded: get(r, idx.dateAdded),
      status: mapStatus(get(r, idx.status)),
    });
  }
  return items;
}

function dateKey(raw: string): number {
  const p = parseDate(raw);
  return p ? p.y * 10000 + p.m * 100 + p.d : Number.POSITIVE_INFINITY;
}

function compare(a: ScheduleItem, b: ScheduleItem): number {
  const ka = dateKey(a.dateAdded);
  const kb = dateKey(b.dateAdded);
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a.project.localeCompare(b.project);
}

export function groupSchedule(items: ScheduleItem[]): ScheduleGroups {
  return {
    active: items.filter((i) => i.status !== 'Done').sort(compare),
    done: items.filter((i) => i.status === 'Done').sort(compare),
  };
}
