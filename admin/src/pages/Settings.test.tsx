import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ getDoc: vi.fn(), setDoc: vi.fn() }));
vi.mock('../lib/firebase.js', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', async (orig) => ({
  ...(await orig<typeof import('firebase/firestore')>()),
  doc: (_db: unknown, path: string) => ({ path }),
  getDoc: h.getDoc,
  setDoc: h.setDoc,
}));

import { renderPage } from '../test-utils';
import Settings from './Settings';

const snap = (data: unknown) => ({ exists: () => true, data: () => data });

beforeEach(() => {
  h.getDoc.mockReset();
  h.setDoc.mockReset();
  h.setDoc.mockResolvedValue(undefined);
  h.getDoc.mockResolvedValue(
    snap({
      guestVisibility: { '/': true, '/links': false },
      ranker: { criteria: [{ id: 'x', label: 'X', weight: 2, invert: true }] },
    }),
  );
});

describe('Settings', () => {
  it('loads toggles and saves guest visibility for the three pages', async () => {
    renderPage(<Settings />, 'admin', '/settings');
    const home = await screen.findByRole('checkbox', { name: /Home/ });
    expect(home).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Links/ })).not.toBeChecked();
    expect(screen.getByText(/without signing in/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Ideas/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(h.setDoc).toHaveBeenCalledWith(expect.anything(), { guestVisibility: { '/': true, '/ideas': true, '/links': false } }, { mergeFields: ['guestVisibility'] }),
    );
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
  });

  async function openCriteria() {
    renderPage(<Settings />, 'admin', '/settings');
    await screen.findByDisplayValue('X');
  }
  const saveCriteria = () => fireEvent.click(screen.getByRole('button', { name: 'Save criteria' }));

  it('saves valid criteria with parsed weight', async () => {
    await openCriteria();
    fireEvent.change(screen.getByPlaceholderText('Weight'), { target: { value: '3' } });
    saveCriteria();
    await waitFor(() =>
      expect(h.setDoc).toHaveBeenCalledWith(expect.anything(), { ranker: { criteria: [{ id: 'x', label: 'X', weight: 3, invert: true }] } }, { merge: true }),
    );
    expect(await screen.findByText('Criteria saved.')).toBeInTheDocument();
  });

  it('shows "Weight must be" message for bad weight', async () => {
    await openCriteria();
    fireEvent.change(screen.getByPlaceholderText('Weight'), { target: { value: '0' } });
    saveCriteria();
    expect(await screen.findByText('Weight must be ≥ 1 (got "0" for "X")')).toBeInTheDocument();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it('shows needs-id-and-label and at-least-one messages', async () => {
    await openCriteria();
    fireEvent.click(screen.getByRole('button', { name: '+ Add criterion' }));
    saveCriteria();
    expect(await screen.findByText('Each criterion needs id and label')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove criterion' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove criterion' })[0]);
    saveCriteria();
    expect(await screen.findByText('At least one criterion required')).toBeInTheDocument();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it('derives a unique id from the label on blur', async () => {
    await openCriteria();
    fireEvent.click(screen.getByRole('button', { name: '+ Add criterion' }));
    const labels = screen.getAllByPlaceholderText('Label');
    fireEvent.change(labels[1], { target: { value: 'X' } });
    fireEvent.blur(labels[1]);
    expect(screen.getByText('id: x_2')).toBeInTheDocument();
  });
});
