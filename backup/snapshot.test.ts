/**
 * A snapshot must be a consistent copy of every DB while the app still has
 * them open (SQLite online backup), must carry the uploaded files, and must
 * never include backups/, WAL/SHM sidecars, or anything else.
 */
import DatabaseConstructor from 'better-sqlite3';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb, type Database } from '../db/connection.js';
import { listBackupSources, snapshotTo } from './snapshot.js';

let dataDir: string;
let auth: Database;
let feed: Database;
let acct1: Database;

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'keepbook-snapshot-'));
  auth = openDb(join(dataDir, 'auth.db'));
  auth.exec('CREATE TABLE accounts (id INTEGER PRIMARY KEY, email TEXT)');
  auth.prepare('INSERT INTO accounts (email) VALUES (?)').run('a@example.com');
  feed = openDb(join(dataDir, 'feed.db'));
  feed.exec('CREATE TABLE feed_filings (id INTEGER PRIMARY KEY, filer TEXT)');
  feed.prepare('INSERT INTO feed_filings (filer) VALUES (?)').run('NC Rate Bureau');
  acct1 = openDb(join(dataDir, 'accounts', '1.db'));
  acct1.exec('CREATE TABLE clients (id INTEGER PRIMARY KEY, name TEXT)');
  acct1.prepare('INSERT INTO clients (name) VALUES (?)').run('Carolina Keel');
  acct1.prepare('INSERT INTO clients (name) VALUES (?)').run('Dee Page');
  mkdirSync(join(dataDir, 'accounts', '1', 'intake', 'abc'), { recursive: true });
  writeFileSync(join(dataDir, 'accounts', '1', 'intake', 'abc', 'dec.pdf'), '%PDF-1.4 fake');
  // Things that must NOT be in the snapshot:
  mkdirSync(join(dataDir, 'backups'), { recursive: true });
  writeFileSync(join(dataDir, 'backups', 'keepbook-2026-09-01T0800Z.tar.gz'), 'old');
  writeFileSync(join(dataDir, 'stray.txt'), 'not a db');
});
afterEach(() => {
  auth.close();
  feed.close();
  acct1.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('listBackupSources', () => {
  it('lists the system DBs that exist, every account DB, and every account folder', () => {
    expect(listBackupSources(dataDir)).toEqual({
      dbFiles: ['auth.db', 'feed.db', join('accounts', '1.db')],
      dirs: [join('accounts', '1')],
    });
    writeFileSync(join(dataDir, 'keepbook.db'), '');
    expect(listBackupSources(dataDir).dbFiles[0]).toBe('keepbook.db');
  });
});

describe('snapshotTo', () => {
  it('copies consistent DBs while they are open, plus uploads, and nothing else', async () => {
    // WAL sidecars exist because the connections are open and have written.
    expect(existsSync(join(dataDir, 'auth.db-wal'))).toBe(true);
    const staging = join(dataDir, 'backups', '.staging-test');
    const manifest = await snapshotTo(staging, dataDir, { appVersion: '0.1.0-test', now: '2026-09-13T08:00:00Z' });

    const copy = new DatabaseConstructor(join(staging, 'accounts', '1.db'), { readonly: true });
    expect(copy.prepare('SELECT count(*) AS n FROM clients').get()).toEqual({ n: 2 });
    copy.close();
    const authCopy = new DatabaseConstructor(join(staging, 'auth.db'), { readonly: true });
    expect(authCopy.prepare('SELECT email FROM accounts').get()).toEqual({ email: 'a@example.com' });
    authCopy.close();

    expect(readFileSync(join(staging, 'accounts', '1', 'intake', 'abc', 'dec.pdf'), 'utf8')).toBe('%PDF-1.4 fake');
    expect(existsSync(join(staging, 'backups'))).toBe(false);
    expect(existsSync(join(staging, 'stray.txt'))).toBe(false);
    expect(existsSync(join(staging, 'auth.db-wal'))).toBe(false);
    expect(existsSync(join(staging, 'auth.db-shm'))).toBe(false);

    expect(manifest.createdAt).toBe('2026-09-13T08:00:00Z');
    expect(manifest.appVersion).toBe('0.1.0-test');
    expect(manifest.files.map((f) => f.path)).toEqual([
      'accounts/1.db',
      'accounts/1/intake/abc/dec.pdf',
      'auth.db',
      'feed.db',
    ]);
    for (const f of manifest.files) expect(f.bytes).toBeGreaterThan(0);
    expect(JSON.parse(readFileSync(join(staging, 'manifest.json'), 'utf8'))).toEqual(manifest);

    // The live DBs are untouched and still writable.
    acct1.prepare('INSERT INTO clients (name) VALUES (?)').run('After Snapshot');
    expect(acct1.prepare('SELECT count(*) AS n FROM clients').get()).toEqual({ n: 3 });
  });

  it('works on an empty data directory', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'keepbook-snapshot-empty-'));
    try {
      const m = await snapshotTo(join(empty, 'backups', '.staging'), empty, { appVersion: 'v', now: '2026-09-13T08:00:00Z' });
      expect(m.files).toEqual([]);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
