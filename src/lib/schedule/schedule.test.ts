import { describe, it, expect } from 'vitest';
import { toScheduleItems, groupSchedule, formatDateLabel, type ScheduleItem } from './schedule';

const H = ['Name', 'Project', 'Public Blurb', 'Date Added', 'Status'];

describe('toScheduleItems', () => {
  it('maps shuffled headers, trimmed and case-insensitive', () => {
    const rows = [
      [' status ', 'DATE ADDED', 'project', 'name', 'public blurb'],
      ['Done', '2026-10-15', 'Proj A', 'Org A', 'Blurb'],
    ];
    expect(toScheduleItems(rows)).toEqual([
      { name: 'Org A', project: 'Proj A', blurb: 'Blurb', dateAdded: '2026-10-15', status: 'Done' },
    ]);
  });

  it('drops private extra columns', () => {
    const rows = [
      [...H, 'Contact', 'Notes'],
      ['Org', 'Proj', '', '2026-10-15', 'To do', 'secret@x.org', 'private note'],
    ];
    const items = toScheduleItems(rows);
    expect(Object.keys(items[0]).sort()).toEqual(['blurb', 'dateAdded', 'name', 'project', 'status']);
    expect(JSON.stringify(items)).not.toContain('secret');
    expect(JSON.stringify(items)).not.toContain('private');
  });

  it.each(['Project', 'Status', 'Date Added'])('throws on missing %s column', (col) => {
    const header = H.filter((h) => h !== col);
    expect(() => toScheduleItems([header, ['a', 'b', 'c', 'd']])).toThrow();
  });

  it('skips blank-Project rows', () => {
    const rows = [H, ['Org', '', '', '2026-10-15', 'To do'], ['Org', '  ', '', '2026-10-15', 'To do'], ['Org', 'P', '', '2026-10-15', 'To do']];
    expect(toScheduleItems(rows).map((i) => i.project)).toEqual(['P']);
  });

  it('applies the status map, unknown to To do', () => {
    const rows = [
      H,
      ['o', 'p1', '', '2026-10-15', 'In review'],
      ['o', 'p2', '', '2026-10-15', 'Waiting'],
      ['o', 'p3', '', '2026-10-15', 'In progress'],
      ['o', 'p4', '', '2026-10-15', 'Blocked?'],
      ['o', 'p5', '', '2026-10-15', 'DONE'],
    ];
    expect(toScheduleItems(rows).map((i) => i.status)).toEqual([
      'In progress', 'In progress', 'In progress', 'To do', 'Done',
    ]);
  });

  it('returns [] for header-only or empty rows', () => {
    expect(toScheduleItems([H])).toEqual([]);
    expect(toScheduleItems([])).toEqual([]);
  });
});

const item = (project: string, dateAdded: string, status: ScheduleItem['status'] = 'To do'): ScheduleItem => ({
  name: 'o', project, blurb: '', dateAdded, status,
});

describe('groupSchedule', () => {
  it('orders non-Done oldest first, ties by project name', () => {
    const g = groupSchedule([
      item('B', '2026-10-20'),
      item('C', '2026-10-15', 'In progress'),
      item('A', '2026-10-20'),
    ]);
    expect(g.active.map((i) => i.project)).toEqual(['C', 'A', 'B']);
    expect(g.done).toEqual([]);
  });

  it('puts Done in its own group with same ordering', () => {
    const g = groupSchedule([
      item('Z', '2026-09-01', 'Done'),
      item('A', '2026-10-01'),
      item('Y', '2026-08-01', 'Done'),
    ]);
    expect(g.active.map((i) => i.project)).toEqual(['A']);
    expect(g.done.map((i) => i.project)).toEqual(['Y', 'Z']);
  });

  it('sorts unparseable dates last within their group', () => {
    const g = groupSchedule([
      item('A', 'garbage'),
      item('B', ''),
      item('C', '2026-12-31'),
      item('D', '2026-01-01', 'Done'),
      item('E', 'nope', 'Done'),
    ]);
    expect(g.active.map((i) => i.project)).toEqual(['C', 'A', 'B']);
    expect(g.done.map((i) => i.project)).toEqual(['D', 'E']);
  });

  it('does not mutate input', () => {
    const input = [item('B', '2026-10-20'), item('A', '2026-10-15')];
    groupSchedule(input);
    expect(input.map((i) => i.project)).toEqual(['B', 'A']);
  });
});

describe('formatDateLabel', () => {
  it('labels YYYY-MM-DD as Mon YYYY without tz drift', () => {
    expect(formatDateLabel('2026-10-01')).toBe('Oct 2026');
    expect(formatDateLabel('2026-12-31')).toBe('Dec 2026');
    expect(formatDateLabel('2026-01-01')).toBe('Jan 2026');
  });
  it('also supports M/D/YYYY', () => {
    expect(formatDateLabel('10/5/2026')).toBe('Oct 2026');
  });
  it('returns empty string when unparseable', () => {
    expect(formatDateLabel('')).toBe('');
    expect(formatDateLabel('soon')).toBe('');
    expect(formatDateLabel('2026-13-01')).toBe('');
  });
});
