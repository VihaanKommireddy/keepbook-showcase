/**
 * When the nightly backup runs. The math is pure arithmetic on epoch ms so it
 * needs no `new Date(` (banned outside core/time.ts) and is trivially
 * testable; the scheduler is a one-shot setTimeout that re-arms itself after
 * every run, unref'd so it never keeps the process alive on its own.
 */
import { nowMs } from '../core/time.js';

export const DAY_MS = 86_400_000;

export function parseHhMm(s: string): { hh: number; mm: number } {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  const hh = m === null ? NaN : Number(m[1]);
  const mm = m === null ? NaN : Number(m[2]);
  if (m === null || hh > 23 || mm > 59) {
    throw new Error(`KEEPBOOK_BACKUP_TIME_UTC must be HH:MM (24-hour, UTC), got "${s}"`);
  }
  return { hh, mm };
}

/**
 * Milliseconds from `nowMs` until the next occurrence of hh:mm UTC. Exactly at
 * hh:mm returns a full day, so a timer that fires and immediately re-arms
 * waits until tomorrow instead of spinning.
 */
export function msUntilNextUtcTime(nowMs: number, hh: number, mm: number): number {
  const target = (hh * 60 + mm) * 60_000;
  const sinceMidnight = ((nowMs % DAY_MS) + DAY_MS) % DAY_MS;
  const delta = target - sinceMidnight;
  return delta > 0 ? delta : delta + DAY_MS;
}

export interface BackupScheduler {
  start(): void;
  stop(): void;
  /** Run now unless a run is in flight; resolves true if it ran. */
  runOnce(): Promise<boolean>;
}

export interface BackupSchedulerOptions {
  run: () => Promise<unknown>;
  /** HH:MM, UTC. */
  timeUtc: string;
  now?: () => number;
  log?: (msg: string) => void;
}

export function createBackupScheduler(opts: BackupSchedulerOptions): BackupScheduler {
  const { hh, mm } = parseHhMm(opts.timeUtc);
  const now = opts.now ?? nowMs;
  const log = opts.log ?? ((): void => undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let stopped = true;

  async function runOnce(): Promise<boolean> {
    if (running) {
      log('backup: a run is already in progress, skipping this trigger');
      return false;
    }
    running = true;
    try {
      await opts.run();
      return true;
    } catch (err) {
      // Whatever `run` does (or fails to do) must never surface as an
      // unhandled rejection here — the scheduler's job is to keep re-arming
      // for tomorrow no matter how badly one run went.
      const msg = err instanceof Error ? err.message : String(err);
      log(`backup: run threw: ${msg}`);
      return true;
    } finally {
      running = false;
    }
  }

  function arm(): void {
    timer = setTimeout(() => {
      timer = undefined;
      void runOnce().finally(() => {
        if (!stopped) arm();
      });
    }, msUntilNextUtcTime(now(), hh, mm));
    timer.unref?.();
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      arm();
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
    runOnce,
  };
}
