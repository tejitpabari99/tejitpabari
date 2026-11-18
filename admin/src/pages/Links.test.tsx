import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  listLinks: vi.fn(),
  saveLink: vi.fn(),
  deleteLink: vi.fn(),
  toCanvas: vi.fn(),
}));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('../lib/links.js', async (orig) => ({
  ...(await orig<typeof import('../lib/links.js')>()),
  listLinks: h.listLinks,
  saveLink: h.saveLink,
  deleteLink: h.deleteLink,
}));
vi.mock('qrcode', () => ({ default: { toCanvas: h.toCanvas } }));

import { renderPage } from '../test-utils';
import Links from './Links';

const LINKS = [
  { slug: 'juno/pitch-deck', url: 'https://example.com/deck', tags: ['Work'], description: '', created: '2026-02-01', expiresAt: null },
  { slug: 'gh', url: 'https://github.com/x', tags: ['Dev'], description: '', created: '2026-01-01', expiresAt: '2000-01-01' },
];

beforeEach(() => {
  Object.values(h).forEach((f) => f.mockReset());
  h.listLinks.mockResolvedValue(LINKS);
  h.saveLink.mockResolvedValue('x');
  h.deleteLink.mockResolvedValue(undefined);
  h.toCanvas.mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

const row = (slug: string) => screen.getByTestId(`row-${slug}`);

describe('Links page', () => {
  it('shows the real slash slug in the short URL and no Clicks/Last Hit/redirect UI', async () => {
    renderPage(<Links />, 'admin');
    expect(await screen.findByText('go.tejitpabari.com/juno/pitch-deck')).toBeInTheDocument();
    expect(screen.queryByText(/Clicks/i)).toBeNull();
    expect(screen.queryByText(/Last Hit/i)).toBeNull();
    expect(screen.queryByText(/redirect/i)).toBeNull();
  });

  it('marks expired links and shows tags', async () => {
    renderPage(<Links />, 'guest');
    await screen.findByTestId('row-gh');
    expect(within(row('gh')).getByText('Expired')).toBeInTheDocument();
    expect(within(row('juno/pitch-deck')).queryByText('Expired')).toBeNull();
    expect(within(row('gh')).getByText('Dev')).toBeInTheDocument();
  });

  it('guest has no write controls but can copy and view QR', async () => {
    renderPage(<Links />, 'guest');
    await screen.findByTestId('row-gh');
    expect(screen.queryByRole('button', { name: /Add Link/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Copy link' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'QR code' }).length).toBe(2);
  });

  it('does not list links on a loader error; surfaces it', async () => {
    h.listLinks.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    renderPage(<Links />, 'guest');
    expect(await screen.findByRole('alert')).toHaveTextContent('Missing or insufficient permissions.');
  });

  it('copy writes the full https short URL', async () => {
    renderPage(<Links />, 'guest');
    await screen.findByTestId('row-juno/pitch-deck');
    fireEvent.click(within(row('juno/pitch-deck')).getByRole('button', { name: 'Copy link' }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://go.tejitpabari.com/juno/pitch-deck'),
    );
  });

  it('QR encodes the full short URL (dynamic qrcode import)', async () => {
    renderPage(<Links />, 'guest');
    await screen.findByTestId('row-juno/pitch-deck');
    fireEvent.click(within(row('juno/pitch-deck')).getByRole('button', { name: 'QR code' }));
    await waitFor(() => expect(h.toCanvas).toHaveBeenCalled());
    expect(h.toCanvas.mock.calls[0][1]).toBe('https://go.tejitpabari.com/juno/pitch-deck');
  });

  it('admin add calls saveLink with parsed tags/expiry, then refreshes', async () => {
    renderPage(<Links />, 'admin');
    await screen.findByTestId('row-gh');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Link' }));
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: ' Juno/New ' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), { target: { value: 'https://new.example.com' } });
    fireEvent.change(screen.getByLabelText(/Tags/), { target: { value: 'a, b ,, c' } });
    fireEvent.change(screen.getByLabelText(/Expires/), { target: { value: '2030-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveLink).toHaveBeenCalledTimes(1));
    expect(h.saveLink).toHaveBeenCalledWith({
      slug: 'juno/new',
      url: 'https://new.example.com',
      tags: ['a', 'b', 'c'],
      expiresAt: '2030-05-01',
    });
    await waitFor(() => expect(h.listLinks).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('admin edit/rename passes existingSlug', async () => {
    renderPage(<Links />, 'admin');
    await screen.findByTestId('row-gh');
    fireEvent.click(within(row('gh')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Slug')).toHaveValue('gh');
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'github' } });
    fireEvent.change(screen.getByLabelText(/Expires/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.saveLink).toHaveBeenCalledTimes(1));
    expect(h.saveLink).toHaveBeenCalledWith({
      slug: 'github',
      url: 'https://github.com/x',
      tags: ['Dev'],
      expiresAt: null,
      existingSlug: 'gh',
    });
  });

  it('shows validateLink messages without calling saveLink', async () => {
    renderPage(<Links />, 'admin');
    await screen.findByTestId('row-gh');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Link' }));
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'bad slug!' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), { target: { value: 'https://x.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slug may only contain a-z, 0-9, -, /');
    expect(h.saveLink).not.toHaveBeenCalled();
  });

  it('surfaces saveLink errors (collision) and keeps the modal open', async () => {
    h.saveLink.mockRejectedValue(new Error('Slug "gh" already exists'));
    renderPage(<Links />, 'admin');
    await screen.findByTestId('row-gh');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Link' }));
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'gh' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), { target: { value: 'https://x.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slug "gh" already exists');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('admin delete confirms, calls deleteLink(slug) and refreshes', async () => {
    renderPage(<Links />, 'admin');
    await screen.findByTestId('row-gh');
    fireEvent.click(within(row('gh')).getByRole('button', { name: 'Delete' }));
    expect(h.deleteLink).not.toHaveBeenCalled();
    fireEvent.click(within(row('gh')).getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(h.deleteLink).toHaveBeenCalledWith('gh'));
    await waitFor(() => expect(h.listLinks).toHaveBeenCalledTimes(2));
  });

  it('filters by search text', async () => {
    renderPage(<Links />, 'guest');
    await screen.findByTestId('row-gh');
    fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: 'juno' } });
    expect(screen.queryByTestId('row-gh')).toBeNull();
    expect(screen.getByTestId('row-juno/pitch-deck')).toBeInTheDocument();
  });
});
