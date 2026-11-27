import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ins = (uid, event, run) =>
  env.DB.prepare(
    "INSERT INTO events (ts, tool_type, tool_name, event, mode, origin, uid, run) VALUES ('2026-01-01T00:00:00Z','plugin','t',?,'prod','o',?,?)",
  )
    .bind(event, uid, run)
    .run();

describe('events schema', () => {
  it('has the expected columns and no country/client', async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(events)').all();
    const cols = results.map((r) => r.name);
    expect(cols).toEqual([
      'id', 'ts', 'tool_type', 'tool_name', 'event', 'mode', 'v', 'org', 'uid',
      'n', 'ok', 'fail', 'step', 'reason', 'origin', 'run', 'extras', 'plugin',
    ]);
    expect(cols).not.toContain('country');
    expect(cols).not.toContain('client');
  });

  it('has a plugin index', async () => {
    const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='events'").all();
    expect(results.map((r) => r.name)).toContain('events_plugin');
  });

  it('0002 backfills existing rows to sparehand, leaves new rows NULL', async () => {
    const mig = env.TEST_MIGRATIONS.find((m) => m.name.startsWith('0002'));
    expect(mig).toBeTruthy();
    const sql = mig.queries.find((q) => /UPDATE\s+events/i.test(q));
    expect(sql).toMatch(/plugin\s*=\s*'sparehand'/);
    await ins('ubf1', 'batch_done', 'rbf1');
    await env.DB.prepare(sql).run();
    const r = await env.DB.prepare("SELECT plugin FROM events WHERE uid='ubf1'").first();
    expect(r.plugin).toBe('sparehand');
    await ins('ubf2', 'batch_done', 'rbf2');
    const r2 = await env.DB.prepare("SELECT plugin FROM events WHERE uid='ubf2'").first();
    expect(r2.plugin).toBeNull();
  });

  it('has the three indexes and the dedupe index', async () => {
    const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='events'").all();
    const names = results.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(['events_ts', 'events_mode_tool_ts', 'events_org', 'events_dedupe']));
  });

  it('rejects duplicate (uid,event,run) with non-null run', async () => {
    await ins('u1', 'batch_done', 'r1');
    await expect(ins('u1', 'batch_done', 'r1')).rejects.toThrow(/UNIQUE/);
    await ins('u1', 'batch_done', 'r2');
  });

  it('allows duplicates with null run', async () => {
    await ins('u2', 'batch_done', null);
    await ins('u2', 'batch_done', null);
    const r = await env.DB.prepare("SELECT COUNT(*) c FROM events WHERE uid='u2'").first();
    expect(r.c).toBe(2);
  });
});
