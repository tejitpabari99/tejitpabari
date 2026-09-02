// src/components/BackButton.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from './BackButton';

describe('BackButton', () => {
  it('defaults to "/" when no to prop is given', () => {
    render(<MemoryRouter><BackButton /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
  });

  it('renders the given to target', () => {
    render(<MemoryRouter><BackButton to="/projects" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/projects');
  });

  it('merges the className prop into the rendered link (regression guard, unchanged by this PRD)', () => {
    render(<MemoryRouter><BackButton className="extra-class" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /back/i }).className).toContain('extra-class');
  });
});
