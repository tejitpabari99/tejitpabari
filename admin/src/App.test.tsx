import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

describe('admin app root', () => {
  it('renders the layout and the home page at /', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('admin.tejitpabari.com')).toBeInTheDocument();
    expect(screen.getByTestId('page')).toHaveTextContent('Home');
  });
});
