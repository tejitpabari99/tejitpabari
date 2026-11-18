import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../analytics', () => ({ trackEvent: vi.fn() }));
import { trackEvent } from '../analytics';
import { NONPROFIT_SCHEDULE_CSV_URL } from '../../config/nonprofit';
import { useSchedule } from './useSchedule';

const CSV = 'Name,Project,Public Blurb,Date Added,Status,Notes\nOrg,P1,,2026-10-15,To do,secret\nOrg,P2,,2026-10-01,Done,secret\n';
const resp = (body: string, status = 200) => new Response(body, { status });

describe('useSchedule', () => {
  beforeEach(() => vi.mocked(trackEvent).mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('starts loading and calls fetch with no-store, signal, no headers', async () => {
    const f = vi.fn().mockResolvedValue(resp(CSV));
    vi.stubGlobal('fetch', f);
    const { result } = renderHook(() => useSchedule());
    expect(result.current.state).toBe('loading');
    await waitFor(() => expect(result.current.state).toBe('ok'));
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe(NONPROFIT_SCHEDULE_CSV_URL);
    expect(opts.cache).toBe('no-store');
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(opts.headers).toBeUndefined();
    expect(opts.credentials).toBeUndefined();
  });

  it('ok: returns items and groups, fires schedule_load ok with row_count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(CSV)));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('ok'));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.groups.active.map((i) => i.project)).toEqual(['P1']);
    expect(result.current.groups.done.map((i) => i.project)).toEqual(['P2']);
    expect(JSON.stringify(result.current)).not.toContain('secret');
    expect(trackEvent).toHaveBeenCalledWith('schedule_load', { state: 'ok', row_count: 2 });
  });

  it('error on fetch reject', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('net')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(trackEvent).toHaveBeenCalledWith('schedule_load', { state: 'error', row_count: 0 });
  });

  it('error on non-200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp('nope', 500)));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(trackEvent).toHaveBeenCalledWith('schedule_load', { state: 'error', row_count: 0 });
  });

  it('error on missing required column', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp('Name,Project\na,b\n')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('error'));
  });

  it('empty on empty body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp('')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('empty'));
    expect(trackEvent).toHaveBeenCalledWith('schedule_load', { state: 'empty', row_count: 0 });
  });

  it('empty on header-only CSV', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp('Name,Project,Public Blurb,Date Added,Status\n')));
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => expect(result.current.state).toBe('empty'));
    expect(trackEvent).toHaveBeenCalledWith('schedule_load', { state: 'empty', row_count: 0 });
  });

  it('aborts on unmount and fires no event', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_u: string, o: RequestInit) => {
        signal = o.signal as AbortSignal;
        return new Promise((_res, rej) => signal!.addEventListener('abort', () => rej(new DOMException('a', 'AbortError'))));
      }),
    );
    const { unmount } = renderHook(() => useSchedule());
    expect(signal!.aborted).toBe(false);
    unmount();
    expect(signal!.aborted).toBe(true);
    await Promise.resolve();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('times out after 10 s with error', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn((_u: string, o: RequestInit) =>
          new Promise((_res, rej) => (o.signal as AbortSignal).addEventListener('abort', () => rej(new DOMException('a', 'AbortError')))),
        ),
      );
      const { result } = renderHook(() => useSchedule());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_001);
      });
      expect(result.current.state).toBe('error');
    } finally {
      vi.useRealTimers();
    }
  });
});
