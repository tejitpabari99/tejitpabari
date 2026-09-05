import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders an <a> when given href', () => {
    render(<Button href="https://example.com">Go</Button>);
    expect(screen.getByRole('link', { name: 'Go' }).tagName).toBe('A');
  });

  it('renders a <button> otherwise', () => {
    render(<Button onClick={() => {}}>Click</Button>);
    expect(screen.getByRole('button', { name: 'Click' }).tagName).toBe('BUTTON');
  });
});
