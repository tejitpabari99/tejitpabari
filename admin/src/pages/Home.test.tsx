import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderPage } from '../test-utils';
import Home from './Home';

describe('Home', () => {
  it('shows only the Ideas and Links cards', () => {
    renderPage(<Home />, 'guest');
    expect(screen.getByRole('link', { name: /Ideas/ })).toHaveAttribute('href', '/ideas');
    expect(screen.getByRole('link', { name: /Links/ })).toHaveAttribute('href', '/links');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByText(/LinkedIn/i)).toBeNull();
  });
});
