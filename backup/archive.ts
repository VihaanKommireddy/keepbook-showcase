/**
 * One backup run, start to finish, and its inverse. runBackup never throws:
 * it returns a result, writes backups/state.json either way, and cleans up
 * its staging folder. The only thing it deletes is old archives of its own
 * naming pattern (rotateLocal). Nothing remote is ever deleted.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import type { Mailer } from '../feed/mailer.js';
import { DEFAULT_S3_PREFIX } from './config.js';
import { decryptKbk1, encryptKbk1, isKbk1 } from './crypto.js';
import type { ObjectStore } from './s3.js';
import { type Manifest, snapshotTo } from './snapshot.js';
import { backupsDir, readState, writeState } from './state.js';

export const ARCHIVE_RE = /^keepbook-\d{4}-\d{2}-\d{2}T\d{4}Z\.tar\.gz(\.enc)?$/;
export const NEEDS_PASSPHRASE = 'off-site upload needs KEEPBOOK_BACKUP_PASSPHRASE';
export const ENCRYPTED_NEEDS_PASSPHRASE =
  'archive is encrypted; set KEEPBOOK_BACKUP_PASSPHRASE or enter it when prompted';
export const TARGET_NOT_EMPTY = 'target directory must not exist or must be empty';

/** '2026-09-13T08:05:59Z' -> '2026-09-13T0805Z' */
export function archiveStamp(now: string): string {
  return `${now.slice(0, 10)}T${now.slice(11, 13)}${now.slice(14, 16)}Z`;
}

export interface RunBackupDeps {
  dataDir: string;
  appVersion: string;
  keep: number;
  passphrase?: string;
  store?: ObjectStore;
  prefix?: string;
  now: () => string;
  log: (msg: string) => void;
  error: (msg: string) => void;
  mailer?: Mailer;
  adminEmails?: string[];
}

export type BackupResult =
  | { ok: true; archive: string; bytes: number; uploadedKey?: string }
  | { ok: false; error: string; archive?: string };

// PATH is all `tar` needs to run; the rest of process.env holds the backup
// passphrase and the S3 secret key, which a child process has no business
// seeing. COPYFILE_DISABLE keeps macOS bsdtar from adding ._* resource-fork
// entries.
const TAR_ENV = { PATH: process.env.PATH ?? '', COPYFILE_DISABLE: '1' };

function tarCreate(out: string, dir: string): void {
  execFileSync('tar', ['-czf', out, '-C', dir, '.'], { stdio: 'pipe', env: TAR_ENV });
}

function tarExtract(archive: string, into: string): void {
  execFileSync('tar', ['-xzf', archive, '-C', into], { stdio: 'pipe', env: TAR_ENV });
}

/** Delete archives beyond the newest `keep`; returns the deleted names, oldest first. */
export function rotateLocal(dir: string, keep: number): string[] {
  if (!existsSync(dir)) return [];
  // config.ts already rejects keep < 1 at boot, but rotateLocal is also
  // called directly (tests, and any future caller) — never let a bad `keep`
  // rotate away every archive.
  const keepAtLeastOne = Math.max(1, keep);
  const names = readdirSync(dir)
    .filter((n) => ARCHIVE_RE.test(n))
    .sort();
  const doomed = names.slice(0, Math.max(0, names.length - keepAtLeastOne));
  for (const n of doomed) rmSync(join(dir, n), { force: true });
  return doomed;
}

async function notifyFailure(deps: RunBackupDeps, error: string, archive: string | undefined): Promise<void> {
  const admins = deps.adminEmails ?? [];
  if (deps.mailer === undefined || admins.length === 0) return;
  const text =
    `The nightly backup failed at ${deps.now()}.\n\n` +
    `Error: ${error}\n` +
    (archive !== undefined ? `Archive: ${basename(archive)}\n` : '') +
    `\nCheck /api/health and the server log. The next scheduled run is the retry.\n`;
  for (const to of admins) {
    try {
      await deps.mailer.send({ to, subject: 'Keepbook backup failed', text });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.error(`backup: failure mail to ${to} did not send: ${message}`);
    }
  }
}

export async function runBackup(deps: RunBackupDeps): Promise<BackupResult> {
  const startedAt = deps.now();
  const stamp = archiveStamp(startedAt);
  const dir = backupsDir(deps.dataDir);
  // The random suffix keeps a manual CLI run from sharing a staging dir with
  // the nightly job if both land in the same minute — the archive name
  // itself (keyed only by stamp) is unchanged.
  const staging = join(dir, `.staging-${stamp}-${randomBytes(4).toString('hex')}`);
  const previous = readState(deps.dataDir);
  let archive: string | undefined;
  try {
    await snapshotTo(staging, deps.dataDir, { appVersion: deps.appVersion, now: startedAt });
    const tarPath = join(dir, `keepbook-${stamp}.tar.gz`);
    tarCreate(tarPath, staging);
    archive = tarPath;
    if (deps.passphrase !== undefined) {
      writeFileSync(`${tarPath}.enc`, encryptKbk1(readFileSync(tarPath), deps.passphrase));
      rmSync(tarPath, { force: true });
      archive = `${tarPath}.enc`;
    }
    const bytes = statSync(archive).size;
    rotateLocal(dir, deps.keep);

    let uploadedKey: string | undefined;
    if (deps.store !== undefined) {
      if (deps.passphrase === undefined) throw new Error(NEEDS_PASSPHRASE);
      uploadedKey = `${deps.prefix ?? DEFAULT_S3_PREFIX}${basename(archive)}`;
      await deps.store.put(uploadedKey, readFileSync(archive));
      const head = await deps.store.head(uploadedKey);
      if (head === null || head.bytes !== bytes) {
        throw new Error(
          `upload verification failed for ${uploadedKey}: expected ${bytes} bytes, bucket reports ${head === null ? 'missing' : head.bytes}`,
        );
      }
    }

    const finishedAt = deps.now();
    writeState(deps.dataDir, {
      lastRunAt: finishedAt,
      lastOkAt: finishedAt,
      lastError: null,
      lastArchive: basename(archive),
      lastUploadedKey: uploadedKey ?? null,
    });
    deps.log(
      `backup ok: ${basename(archive)} (${bytes} bytes)${uploadedKey !== undefined ? `, uploaded as ${uploadedKey}` : ', local only'}`,
    );
    return uploadedKey !== undefined ? { ok: true, archive, bytes, uploadedKey } : { ok: true, archive, bytes };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    deps.error(`backup failed: ${error}`);
    // writeState can itself throw (ENOSPC/EACCES on backups/ — the same disk
    // problem that likely caused the run to fail in the first place). That
    // must never escape this catch: an exception thrown here would propagate
    // out of runBackup as a rejection, and on Node 26 an unhandled rejection
    // is fatal — crash, restart, catch-up 60s later, crash again.
    try {
      writeState(deps.dataDir, {
        ...previous,
        lastRunAt: deps.now(),
        lastError: error,
        lastArchive: archive !== undefined ? basename(archive) : previous.lastArchive,
      });
    } catch (stateErr) {
      const msg = stateErr instanceof Error ? stateErr.message : String(stateErr);
      deps.error(`backup: could not write state.json: ${msg}`);
    }
    await notifyFailure(deps, error, archive);
    return archive !== undefined ? { ok: false, error, archive } : { ok: false, error };
  } finally {
    try {
      rmSync(staging, { recursive: true, force: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.error(`backup: could not remove staging folder ${staging}: ${message}`);
    }
  }
}

/**
 * Decrypt (if needed) and unpack an archive into targetDir, which must not
 * exist or must be empty. Returns the manifest. Throws before touching the
 * target on a bad passphrase.
 */
export function restoreArchive(archive: string, targetDir: string, opts: { passphrase?: string }): Manifest {
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) throw new Error(TARGET_NOT_EMPTY);
  const createdTargetDir = !existsSync(targetDir);
  let bytes: Buffer = readFileSync(archive);
  let scratch: string | undefined;
  try {
    if (isKbk1(bytes)) {
      if (opts.passphrase === undefined) throw new Error(ENCRYPTED_NEEDS_PASSPHRASE);
      bytes = decryptKbk1(bytes, opts.passphrase);
      scratch = mkdtempSync(join(tmpdir(), 'keepbook-restore-'));
      const plain = join(scratch, 'archive.tar.gz');
      writeFileSync(plain, bytes);
      archive = plain;
    }
    mkdirSync(targetDir, { recursive: true });
    try {
      tarExtract(archive, targetDir);
    } catch (err) {
      // A corrupt/non-tar archive must leave nothing behind, same guarantee
      // the wrong-passphrase path above already has (it never creates
      // targetDir at all). Only clean up a dir THIS call created — an
      // existing empty dir the caller passed in is theirs, not ours.
      if (createdTargetDir) rmSync(targetDir, { recursive: true, force: true });
      throw err;
    }
  } finally {
    if (scratch !== undefined) rmSync(scratch, { recursive: true, force: true });
  }
  const manifestPath = join(targetDir, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error('restored archive has no manifest.json');
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
}
