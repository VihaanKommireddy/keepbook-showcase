/**
 * runBackup end to end on a temp data dir with a fake object store, then
 * restoreArchive back into a fresh folder. Also: rotation, the
 * no-passphrase-no-upload rule, upload verification, and failure mail.
 */
import DatabaseConstructor from 'better-sqlite3';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb, type Database } from '../db/connection.js';
import { createLogMailer } from '../feed/mailer.js';
import { BAD_PASSPHRASE } from './crypto.js';
import {
  ARCHIVE_RE,
  ENCRYPTED_NEEDS_PASSPHRASE,
  NEEDS_PASSPHRASE,
  TARGET_NOT_EMPTY,
  archiveStamp,
  restoreArchive,
  rotateLocal,
  runBackup,
  type RunBackupDeps,
} from './archive.js';
import type { ObjectStore } from './s3.js';
import { readState } from './state.js';

function fakeStore(over: Partial<ObjectStore> = {}): ObjectStore & { objects: Map<string, Buffer> } {
  const objects = new Map<string, Buffer>();
  return {
    objects,
    put(key, body) {
      objects.set(key, Buffer.from(body));
      return Promise.resolve();
    },
    head(key) {
      const b = objects.get(key);
      return Promise.resolve(b === undefined ? null : { bytes: b.length });
    },
    ...over,
  };
}

let dataDir: string;
let acct: Database;
let clock = 0;
const times = ['2026-09-13T08:00:00Z', '2026-09-13T08:00:03Z', '2026-09-13T08:00:05Z', '2026-09-13T08:00:07Z'];

function deps(over: Partial<RunBackupDeps> = {}): RunBackupDeps {
  return {
    dataDir,
    appVersion: '0.1.0-test',
    keep: 7,
    now: () => times[Math.min(clock++, times.length - 1)] ?? '2026-09-13T08:00:00Z',
    log: () => undefined,
    error: () => undefined,
    ...over,
  };
}

beforeEach(() => {
  clock = 0;
  dataDir = mkdtempSync(join(tmpdir(), 'keepbook-archive-'));
  const auth = openDb(join(dataDir, 'auth.db'));
  auth.exec('CREATE TABLE accounts (id INTEGER PRIMARY KEY, email TEXT)');
  auth.prepare('INSERT INTO accounts (email) VALUES (?)').run('a@example.com');
  auth.close();
  acct = openDb(join(dataDir, 'accounts', '1.db'));
  acct.exec('CREATE TABLE clients (id INTEGER PRIMARY KEY, name TEXT)');
  acct.prepare('INSERT INTO clients (name) VALUES (?)').run('Carolina Keel');
  mkdirSync(join(dataDir, 'accounts', '1', 'intake', 'x'), { recursive: true });
  writeFileSync(join(dataDir, 'accounts', '1', 'intake', 'x', 'dec.pdf'), '%PDF-1.4 fake');
});
afterEach(() => {
  acct.close();
  rmSync(dataDir, { recursive: true, force: true });
});

function archivesIn(dir: string): string[] {
  return readdirSync(dir).filter((n) => ARCHIVE_RE.test(n)).sort();
}

describe('archiveStamp', () => {
  it('is date + HHMM, UTC', () => {
    expect(archiveStamp('2026-09-13T08:05:59Z')).toBe('2026-09-13T0805Z');
  });
});

describe('runBackup, local only', () => {
  it('writes a plaintext tar.gz, no staging left behind, state recorded', async () => {
    const r = await runBackup(deps());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.archive).toBe(join(dataDir, 'backups', 'keepbook-2026-09-13T0800Z.tar.gz'));
    expect(r.bytes).toBeGreaterThan(0);
    expect(r.uploadedKey).toBeUndefined();
    expect(archivesIn(join(dataDir, 'backups'))).toEqual(['keepbook-2026-09-13T0800Z.tar.gz']);
    expect(readdirSync(join(dataDir, 'backups')).some((n) => n.startsWith('.staging-'))).toBe(false);
    expect(readState(dataDir)).toEqual({
      lastRunAt: '2026-09-13T08:00:03Z',
      lastOkAt: '2026-09-13T08:00:03Z',
      lastError: null,
      lastArchive: 'keepbook-2026-09-13T0800Z.tar.gz',
      lastUploadedKey: null,
    });
  });

  it('encrypts when a passphrase is set and deletes the plaintext', async () => {
    const r = await runBackup(deps({ passphrase: 'pp' }));
    expect(r.ok).toBe(true);
    expect(archivesIn(join(dataDir, 'backups'))).toEqual(['keepbook-2026-09-13T0800Z.tar.gz.enc']);
  });
});

describe('restoreArchive', () => {
  it('restores an encrypted archive into a fresh folder with the rows intact', async () => {
    const r = await runBackup(deps({ passphrase: 'pp' }));
    if (!r.ok) throw new Error(r.error);
    const target = join(dataDir, 'restored');
    const manifest = restoreArchive(r.archive, target, { passphrase: 'pp' });
    expect(manifest.files.map((f) => f.path)).toEqual(['accounts/1.db', 'accounts/1/intake/x/dec.pdf', 'auth.db']);
    const db = new DatabaseConstructor(join(target, 'accounts', '1.db'), { readonly: true });
    expect(db.prepare('SELECT name FROM clients').get()).toEqual({ name: 'Carolina Keel' });
    db.close();
    expect(existsSync(join(target, 'accounts', '1', 'intake', 'x', 'dec.pdf'))).toBe(true);
    expect(existsSync(join(target, 'manifest.json'))).toBe(true);
  });

  it('restores a plaintext archive too, and into an existing empty folder', async () => {
    const r = await runBackup(deps());
    if (!r.ok) throw new Error(r.error);
    const target = join(dataDir, 'restored');
    mkdirSync(target);
    expect(restoreArchive(r.archive, target, {}).files).toHaveLength(3);
  });

  it('refuses a non-empty target, a missing passphrase, and a wrong passphrase', async () => {
    const r = await runBackup(deps({ passphrase: 'pp' }));
    if (!r.ok) throw new Error(r.error);
    const busy = join(dataDir, 'busy');
    mkdirSync(busy);
    writeFileSync(join(busy, 'x'), '');
    expect(() => restoreArchive(r.archive, busy, { passphrase: 'pp' })).toThrow(TARGET_NOT_EMPTY);
    expect(() => restoreArchive(r.archive, join(dataDir, 'r2'), {})).toThrow(ENCRYPTED_NEEDS_PASSPHRASE);
    expect(() => restoreArchive(r.archive, join(dataDir, 'r3'), { passphrase: 'nope' })).toThrow(BAD_PASSPHRASE);
    expect(existsSync(join(dataDir, 'r3'))).toBe(false);
  });

  it('leaves nothing behind when the archive is not a tar at all', () => {
    const notATar = join(dataDir, 'not-a-tar.tar.gz');
    writeFileSync(notATar, 'not a tar');
    const target = join(dataDir, 'r4');
    expect(() => restoreArchive(notATar, target, {})).toThrow();
    expect(existsSync(target)).toBe(false);
  });
});

describe('runBackup, off-site', () => {
  it('uploads the encrypted archive under the prefix and verifies the byte count', async () => {
    const store = fakeStore();
    const r = await runBackup(deps({ passphrase: 'pp', store, prefix: 'kb/' }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.uploadedKey).toBe('kb/keepbook-2026-09-13T0800Z.tar.gz.enc');
    expect(store.objects.get('kb/keepbook-2026-09-13T0800Z.tar.gz.enc')?.length).toBe(r.bytes);
    expect(readState(dataDir).lastUploadedKey).toBe('kb/keepbook-2026-09-13T0800Z.tar.gz.enc');
  });

  it('defaults the prefix to keepbook/', async () => {
    const store = fakeStore();
    const r = await runBackup(deps({ passphrase: 'pp', store }));
    expect(r.ok && r.uploadedKey).toBe('keepbook/keepbook-2026-09-13T0800Z.tar.gz.enc');
  });

  it('without a passphrase: local archive still written, upload refused, state shows the error', async () => {
    const store = fakeStore();
    const r = await runBackup(deps({ store }));
    expect(r).toEqual({
      ok: false,
      error: NEEDS_PASSPHRASE,
      archive: join(dataDir, 'backups', 'keepbook-2026-09-13T0800Z.tar.gz'),
    });
    expect(store.objects.size).toBe(0);
    expect(archivesIn(join(dataDir, 'backups'))).toEqual(['keepbook-2026-09-13T0800Z.tar.gz']);
    const s = readState(dataDir);
    expect(s.lastError).toBe(NEEDS_PASSPHRASE);
    expect(s.lastOkAt).toBeNull();
    expect(s.lastArchive).toBe('keepbook-2026-09-13T0800Z.tar.gz');
  });

  it('a byte-count mismatch after upload is a failure that keeps the previous lastOkAt', async () => {
    const good = await runBackup(deps({ passphrase: 'pp', store: fakeStore() }));
    expect(good.ok).toBe(true);
    clock = 2;
    const lying = fakeStore({ head: () => Promise.resolve({ bytes: 1 }) });
    const r = await runBackup(deps({ passphrase: 'pp', store: lying }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/upload verification failed/);
    const s = readState(dataDir);
    expect(s.lastOkAt).toBe('2026-09-13T08:00:03Z');
    expect(s.lastRunAt).toBe('2026-09-13T08:00:07Z');
    expect(s.lastError).toMatch(/upload verification failed/);
  });

  it('a missing object after upload is also a failure', async () => {
    const vanish = fakeStore({ head: () => Promise.resolve(null) });
    const r = await runBackup(deps({ passphrase: 'pp', store: vanish }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/bucket reports missing/);
  });
});

describe('failure mail', () => {
  it('sends one message per admin through the mailer, and none on success', async () => {
    const mailer = createLogMailer();
    const bad = fakeStore({ put: () => Promise.reject(new Error('bucket said no')) });
    const r = await runBackup(deps({ passphrase: 'pp', store: bad, mailer, adminEmails: ['a@x.com', 'b@x.com'] }));
    expect(r.ok).toBe(false);
    expect(mailer.sent.map((m) => m.to)).toEqual(['a@x.com', 'b@x.com']);
    expect(mailer.sent[0]?.subject).toBe('Keepbook backup failed');
    expect(mailer.sent[0]?.text).toContain('bucket said no');
    expect(mailer.sent[0]?.text).toContain('keepbook-2026-09-13T0800Z.tar.gz.enc');

    const ok = await runBackup(deps({ passphrase: 'pp', store: fakeStore(), mailer, adminEmails: ['a@x.com'] }));
    expect(ok.ok).toBe(true);
    expect(mailer.sent).toHaveLength(2);
  });

  it('a mailer that throws does not change the result', async () => {
    const mailer = { kind: 'boom', send: () => Promise.reject(new Error('smtp down')) };
    const r = await runBackup(deps({ store: fakeStore(), mailer, adminEmails: ['a@x.com'] }));
    expect(!r.ok && r.error).toBe(NEEDS_PASSPHRASE);
  });
});

describe('rotateLocal', () => {
  it('keeps the newest N by name and ignores anything that is not an archive', () => {
    const dir = join(dataDir, 'backups');
    mkdirSync(dir, { recursive: true });
    const names = [];
    for (let d = 1; d <= 9; d++) {
      const n = `keepbook-2026-09-0${d}T0800Z.tar.gz${d % 2 === 0 ? '.enc' : ''}`;
      names.push(n);
      writeFileSync(join(dir, n), 'x');
    }
    writeFileSync(join(dir, 'state.json'), '{}');
    writeFileSync(join(dir, 'notes.txt'), 'keep me');
    writeFileSync(join(dir, 'keepbook-manual.tar.gz'), 'keep me too');
    const deleted = rotateLocal(dir, 7);
    expect(deleted).toEqual([names[0], names[1]]);
    expect(archivesIn(dir)).toEqual(names.slice(2));
    expect(existsSync(join(dir, 'notes.txt'))).toBe(true);
    expect(existsSync(join(dir, 'keepbook-manual.tar.gz'))).toBe(true);
    expect(existsSync(join(dir, 'state.json'))).toBe(true);
  });

  it('runBackup applies it', async () => {
    const dir = join(dataDir, 'backups');
    mkdirSync(dir, { recursive: true });
    for (let d = 1; d <= 3; d++) writeFileSync(join(dir, `keepbook-2026-09-0${d}T0800Z.tar.gz`), 'x');
    const r = await runBackup(deps({ keep: 2 }));
    expect(r.ok).toBe(true);
    expect(archivesIn(dir)).toEqual(['keepbook-2026-09-03T0800Z.tar.gz', 'keepbook-2026-09-13T0800Z.tar.gz']);
  });
});

describe('runBackup, backups/ cannot be written', () => {
  // chmod-based write-protection is bypassed for root (see the staging-cleanup
  // test below for the same caveat).
  it.skipIf(process.getuid?.() === 0)(
    'still resolves ok:false when writeState itself throws (the reviewer\'s ENOSPC crash-loop)',
    async () => {
      const dir = join(dataDir, 'backups');
      const errors: string[] = [];
      let calls = 0;
      // The archive must exist BEFORE backups/ goes read-only (that's the real
      // ENOSPC/EACCES scenario: plenty of room to write the archive, none left
      // for state.json) — so the lockdown happens as a side effect of the
      // SECOND deps.now() call, which is the `lastRunAt: deps.now()` argument
      // evaluated right before the catch block's writeState() runs.
      const r = await runBackup(
        deps({
          store: fakeStore(),
          // no passphrase + a store => the try block throws NEEDS_PASSPHRASE
          // once the archive is already on disk.
          error: (m) => errors.push(m),
          now: () => {
            calls += 1;
            if (calls === 2) chmodSync(dir, 0o500);
            return times[Math.min(calls - 1, times.length - 1)] ?? '2026-09-13T08:00:00Z';
          },
        }),
      );
      try {
        expect(r.ok).toBe(false);
        expect(!r.ok && r.error).toBe(NEEDS_PASSPHRASE);
        expect(errors.some((m) => /could not write state\.json/.test(m))).toBe(true);
      } finally {
        chmodSync(dir, 0o700);
      }
    },
  );
});

describe('runBackup, staging cleanup', () => {
  // chmod-based write-protection is bypassed for root, which would make this
  // test's premise (cleanup fails) false rather than skipped-for-a-good-reason.
  it.skipIf(process.getuid?.() === 0)(
    'does not throw when the staging folder cannot be fully removed, and logs it instead',
    async () => {
      const dir = join(dataDir, 'backups');
      const errors: string[] = [];
      let calls = 0;
      let staging: string | undefined;
      try {
        // The staging folder name now carries a random suffix (item i), so it
        // can't be precomputed — discover it once it exists. By the SECOND
        // now() call (`finishedAt`, evaluated right before the success-path
        // writeState) tarCreate has already archived staging's contents, so
        // locking staging itself down here only affects the finally block's
        // own cleanup, not the backup's correctness.
        const r = await runBackup(
          deps({
            error: (m) => errors.push(m),
            now: () => {
              calls += 1;
              if (calls === 2) {
                const name = readdirSync(dir).find((n) => n.startsWith('.staging-'));
                if (name !== undefined) {
                  staging = join(dir, name);
                  // Removing a directory entry needs write permission on its
                  // parent — r-x on staging itself blocks rmSync from
                  // unlinking anything directly inside it.
                  chmodSync(staging, 0o500);
                }
              }
              return calls === 1 ? '2026-09-13T09:00:00Z' : '2026-09-13T09:00:05Z';
            },
          }),
        );
        expect(r.ok).toBe(true);
        expect(staging).toBeDefined();
        expect(errors.some((m) => /could not remove staging folder/.test(m) && staging !== undefined && m.includes(staging))).toBe(
          true,
        );
      } finally {
        if (staging !== undefined) chmodSync(staging, 0o700);
      }
    },
  );
});
