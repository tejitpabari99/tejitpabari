import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { SCHEDULE_UNAVAILABLE, STATUS_COLORS, type ScheduleStatus } from '@/config/nonprofit';
import type { ScheduleItem } from '@/lib/schedule/schedule';
import { StatusPill } from './StatusPill';
import { ScheduleCard } from './ScheduleCard';
import { ScheduleList } from './ScheduleList';
import { ScheduleSkeleton } from './ScheduleSkeleton';
import { ScheduleUnavailable } from './ScheduleUnavailable';

afterEach(cleanup);

const item = (o: Partial<ScheduleItem> = {}): ScheduleItem => ({
  name: 'Helping Hands', project: 'Volunteer intake', blurb: 'Automating sign-ups.',
  dateAdded: '2026-10-05', status: 'In progress', ...o,
});

describe('StatusPill', () => {
  it.each(['To do', 'In progress', 'Done'] as ScheduleStatus[])('shows %s text with its color classes', (s) => {
    render(<StatusPill status={s} />);
    const pill = screen.getByText(s);
    for (const c of STATUS_COLORS[s].split(' ')) expect(pill).toHaveClass(c);
  });
});

describe('ScheduleCard', () => {
  it('renders org, project, blurb, status text and date label', () => {
    render(<ScheduleCard item={item()} />);
    expect(screen.getByText('Helping Hands')).toBeInTheDocument();
    expect(screen.getByText('Volunteer intake')).toBeInTheDocument();
    expect(screen.getByText('Automating sign-ups.')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Oct 2026')).toBeInTheDocument();
  });

  it('omits blurb when empty and date when unparseable', () => {
    const { container } = render(<ScheduleCard item={item({ blurb: '', dateAdded: 'nope' })} />);
    expect(container.querySelector('[data-testid="blurb"]')).toBeNull();
    expect(screen.queryByText(/\d{4}/)).toBeNull();
  });

  it('never renders private columns', () => {
    const leaky = { ...item(), contact: 'secret@example.org', notes: 'PRIVATE NOTE', Contact: 'c1', Notes: 'n1' } as unknown as ScheduleItem;
    const { container } = render(<ScheduleCard item={leaky} />);
    for (const v of ['secret@example.org', 'PRIVATE NOTE', 'c1', 'n1']) {
      expect(container.textContent).not.toContain(v);
    }
  });
});

describe('ScheduleList', () => {
  it('renders active cards then Done section last under its own H2', () => {
    const groups = {
      active: [item({ project: 'A1' }), item({ project: 'A2', status: 'To do' })],
      done: [item({ project: 'D1', status: 'Done' })],
    };
    const { container } = render(<ScheduleList groups={groups} />);
    const h2 = screen.getByRole('heading', { level: 2, name: 'Done' });
    const text = container.textContent!;
    expect(text.indexOf('A1')).toBeLessThan(text.indexOf('A2'));
    expect(text.indexOf('A2')).toBeLessThan(text.indexOf('Done'));
    expect(text.indexOf('Done')).toBeLessThan(text.indexOf('D1'));
    expect(within(h2.closest('section')!).getByText('D1')).toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-2')).not.toBeNull();
    expect(container.querySelector('.grid-cols-1')).not.toBeNull();
  });

  it('omits Done section when none are done', () => {
    render(<ScheduleList groups={{ active: [item()], done: [] }} />);
    expect(screen.queryByRole('heading', { name: 'Done' })).toBeNull();
  });
});

describe('ScheduleSkeleton / ScheduleUnavailable', () => {
  it('skeleton is aria-busy', () => {
    const { container } = render(<ScheduleSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
  it('unavailable message has role=status and config text', () => {
    render(<ScheduleUnavailable />);
    expect(screen.getByRole('status')).toHaveTextContent(SCHEDULE_UNAVAILABLE);
  });
});
