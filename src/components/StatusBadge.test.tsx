// src/components/StatusBadge.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders "Completed" with the solid teal background and white text, no opacity modifier', () => {
    render(<StatusBadge status="Completed" />);
    const badge = screen.getByText('Completed');
    expect(badge).toHaveClass('bg-teal', 'text-white');
    expect(badge).not.toHaveClass('bg-teal/92');
  });

  it('renders "Building" with the solid status-building background and white text, no opacity modifier', () => {
    render(<StatusBadge status="Building" />);
    const badge = screen.getByText('Building');
    expect(badge).toHaveClass('bg-status-building', 'text-white');
    expect(badge).not.toHaveClass('bg-status-building/92');
  });

  it('renders "Not Started" with the solid slate-dark background and white text, no opacity modifier', () => {
    render(<StatusBadge status="Not Started" />);
    const badge = screen.getByText('Not Started');
    expect(badge).toHaveClass('bg-slate-dark', 'text-white');
    expect(badge).not.toHaveClass('bg-slate-dark/92');
  });

  it('defaults to size="md" padding/font-size classes', () => {
    render(<StatusBadge status="Building" />);
    expect(screen.getByText('Building')).toHaveClass('px-3', 'py-1', 'text-[0.68rem]');
  });

  it('renders size="sm" padding/font-size classes when requested', () => {
    render(<StatusBadge status="Building" size="sm" />);
    expect(screen.getByText('Building')).toHaveClass('px-2', 'py-0.5', 'text-[0.58rem]');
  });

  it("composes a caller-supplied className alongside the component's own classes", () => {
    render(<StatusBadge status="Building" className="absolute left-3 top-3" />);
    expect(screen.getByText('Building')).toHaveClass(
      'absolute', 'left-3', 'top-3', 'bg-status-building',
    );
  });

  it('renders the status text as the only content, for every BadgeStatus value', () => {
    (['Not Started', 'Building', 'Completed'] as const).forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(status).textContent).toBe(status);
      unmount();
    });
  });

  it('renders a rounded-pill box, not a rounded-full circle', () => {
    render(<StatusBadge status="Completed" />);
    const badge = screen.getByText('Completed');
    expect(badge).toHaveClass('rounded-pill');
    expect(badge).not.toHaveClass('rounded-full');
  });
});
