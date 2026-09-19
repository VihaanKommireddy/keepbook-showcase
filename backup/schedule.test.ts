/** Pure schedule math plus the timer wrapper, on fake timers. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY_MS, createBackupScheduler, msUntilNextUtcTime, parseHhMm } from './schedule.js';

describe('parseHhMm', () => {
  it('parses HH:MM', () => {
    expect(parseHhMm('08:00')).toEqual({ hh: 8, mm: 0 });
    expect(parseHhMm('23:59')).toEqual({ hh: 23, mm: 59 });
  });
  it('rejects anything that is not a real HH:MM', () => {
    for (const bad of ['25:00', '8', '08:60', '8:00', '', '08:00:00']) {
      expect(() => parseHhMm(bad)).toThrow(/HH:MM/);
    }
  });
});

describe('msUntilNextUtcTime', () => {
  const t0800 = Date.UTC(2026, 8, 13, 8, 0, 0, 0); // 2026-09-13T08:00:00.000Z
  it('one ms before the time fires in 1 ms', () => {
    expect(msUntilNextUtcTime(t0800 - 1, 8, 0)).toBe(1);
  });
  it('exactly at the time waits a full day (so a rescheduling timer never spins)', () => {
    expect(msUntilNextUtcTime(t0800, 8, 0)).toBe(DAY_MS);
  });
  it('one ms after the time wraps to tomorrow', () => {
    expect(msUntilNextUtcTime(t0800 + 1, 8, 0)).toBe(DAY_MS - 1);
  });
  it('handles minutes and a time earlier in the day than now', () => {
    const t1230 = Date.UTC(2026, 8, 13, 12, 30);
    expect(msUntilNextUtcTime(t1230, 3, 15)).toBe(Date.UTC(2026, 8, 14, 3, 15) - t1230);
  });
});

describe('createBackupScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 8, 13, 7, 59, 59));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires at the next HH:MM and then again a day later', async () => {
    const runs: number[] = [];
    const s = createBackupScheduler({
      run: () => {
        runs.push(Date.now());
        return Promise.resolve();
      },
      timeUtc: '08:00',
    });
    s.start();
    await vi.advanceTimersByTimeAsync(999);
    expect(runs).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(runs).toEqual([Date.UTC(2026, 8, 13, 8, 0, 0)]);
    await vi.advanceTimersByTimeAsync(DAY_MS);
    expect(runs).toHaveLength(2);
    s.stop();
    await vi.advanceTimersByTimeAsync(DAY_MS);
    expect(runs).toHaveLength(2);
  });

  it('skips a trigger while a run is still in flight', async () => {
    let release: () => void = () => undefined;
    let started = 0;
    const logs: string[] = [];
    const s = createBackupScheduler({
      run: () => {
        started += 1;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      },
      timeUtc: '08:00',
      log: (m) => logs.push(m),
    });
    const first = s.runOnce();
    const second = await s.runOnce();
    expect(second).toBe(false);
    expect(started).toBe(1);
    expect(logs.some((l) => /already in progress/.test(l))).toBe(true);
    release();
    expect(await first).toBe(true);
  });

  it('a run that rejects is logged and the next day\'s timer still arms', async () => {
    let calls = 0;
    const logs: string[] = [];
    const s = createBackupScheduler({
      run: () => {
        calls += 1;
        return calls === 1 ? Promise.reject(new Error('disk full')) : Promise.resolve();
      },
      timeUtc: '08:00',
      log: (m) => logs.push(m),
    });
    s.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toBe(1);
    expect(logs.some((l) => l.includes('run threw'))).toBe(true);
    await vi.advanceTimersByTimeAsync(DAY_MS);
    expect(calls).toBe(2);
    s.stop();
  });

  it('start is idempotent', async () => {
    let runs = 0;
    const s = createBackupScheduler({
      run: () => {
        runs += 1;
        return Promise.resolve();
      },
      timeUtc: '08:00',
    });
    s.start();
    s.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(runs).toBe(1);
    s.stop();
  });
});
