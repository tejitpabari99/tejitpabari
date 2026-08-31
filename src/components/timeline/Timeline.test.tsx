import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Timeline } from './Timeline';
import type { WorkExperience } from '@/data';

function entry(id: string, startDate: string, endDate: string | 'Present' = 'Present'): WorkExperience {
  return {
    id,
    company: `Co ${id}`,
    role: `Role ${id}`,
    startDate,
    endDate,
    links: [],
    draftDate: false,
    body: `Body ${id}`,
  };
}

const fixtures = [entry('a', '2024-01-01'), entry('b', '2022-01-01', '2023-12-01')];

function renderTimeline(props: Partial<React.ComponentProps<typeof Timeline>> = {}) {
  return render(
    <MemoryRouter>
      <Timeline entries={fixtures} {...props} />
    </MemoryRouter>,
  );
}

describe('Timeline', () => {
  it('marks only index 0 as current (accent dot class)', () => {
    renderTimeline();
    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    expect(items[0].className).toContain('before:bg-teal');
    expect(items[0].className).not.toContain('before:bg-teal-secondary/20');
    expect(items[1].className).toContain('before:bg-teal-secondary/20');
  });

  it('renders no TimelineSeeAllStub when showSeeAll is false', () => {
    renderTimeline({ showSeeAll: false });
    expect(screen.queryByText('See all experience')).not.toBeInTheDocument();
  });

  it('renders TimelineSeeAllStub when showSeeAll is true, and the preceding entry keeps pb-6 (not pb-1)', () => {
    renderTimeline({ showSeeAll: true });
    expect(screen.getByText('See all experience')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    const lastRealEntry = items[items.length - 1];
    expect(lastRealEntry.className).toContain('pb-6');
    expect(lastRealEntry.className).not.toContain('pb-1');
  });

  it('gives the true last entry pb-1 when there is no stub', () => {
    renderTimeline({ showSeeAll: false });
    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    expect(items[items.length - 1].className).toContain('pb-1');
  });
});
