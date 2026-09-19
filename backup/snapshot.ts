/**
 * Copy the data directory into a staging folder in a form that is safe while
 * the server is running: every SQLite file goes through SQLite's own online
 * backup (a consistent single-file copy that already contains committed WAL
 * pages, so -wal/-shm sidecars are never copied), and each account's data
 * folder (uploaded dec pages, intake/files.ts) is copied as plain files.
 * backups/ itself and anything unrecognised at the top level are skipped.
 *
 * Each copy's journal mode is then flipped from WAL to DELETE: the online
 * backup carries over the source's WAL header flag even though no -wal file
 * was copied, and the first open of the copy would otherwise make SQLite
 * create fresh -wal/-shm sidecars just to service that one read. DELETE
 * makes the copy a true self-contained single file; openDb() (db/connection.ts)
 * re-enables WAL the next time a restored copy is opened for real use.
 */
import DatabaseConstructor from 'better-sqlite3';
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const SYSTEM_DBS = ['keepbook.db', 'auth.db', 'feed.db'] as const;

export interface BackupSources {
  /** Relative to dataDir, in copy order. */
  dbFiles: string[];
  /** Account data folders, relative to dataDir. */
  dirs: string[];
}

export function listBackupSources(dataDir: string): BackupSources {
  const dbFiles: string[] = [];
  const dirs: string[] = [];
  for (const name of SYSTEM_DBS) {
    if (existsSync(join(dataDir, name))) dbFiles.push(name);
  }
  const accounts = join(dataDir, 'accounts');
  if (existsSync(accounts)) {
    const entries = readdirSync(accounts, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.db')) dbFiles.push(join('accounts', e.name));
      else if (e.isDirectory()) dirs.push(join('accounts', e.name));
    }
  }
  return { dbFiles, dirs };
}

export interface ManifestFile {
  /** Forward-slash path relative to the archive root. */
  path: string;
  bytes: number;
}

export interface Manifest {
  createdAt: string;
  appVersion: string;
  files: ManifestFile[];
}

function walk(root: string, dir: string, out: ManifestFile[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(root, full, out);
    else if (e.isFile()) {
      out.push({ path: relative(root, full).split(sep).join('/'), bytes: statSync(full).size });
    }
  }
}

export async function snapshotTo(
  staging: string,
  dataDir: string,
  opts: { appVersion: string; now: string },
): Promise<Manifest> {
  mkdirSync(staging, { recursive: true });
  const { dbFiles, dirs } = listBackupSources(dataDir);
  for (const rel of dbFiles) {
    const dest = join(staging, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const db = new DatabaseConstructor(join(dataDir, rel), { readonly: true, fileMustExist: true });
    try {
      await db.backup(dest);
    } finally {
      db.close();
    }
    // The source is WAL-mode, so the backed-up page 1 still carries the WAL
    // format flag even though no -wal file was copied; left as-is, the very
    // first read of the copy would make SQLite create fresh -wal/-shm
    // sidecars just to service that read. Flip the copy to a plain rollback
    // journal so it is truly a self-contained single file.
    const fresh = new DatabaseConstructor(dest);
    try {
      fresh.pragma('journal_mode = DELETE');
    } finally {
      fresh.close();
    }
  }
  for (const rel of dirs) {
    cpSync(join(dataDir, rel), join(staging, rel), { recursive: true });
  }
  const files: ManifestFile[] = [];
  walk(staging, staging, files);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)); // code-point order, locale-proof
  const manifest: Manifest = { createdAt: opts.now, appVersion: opts.appVersion, files };
  writeFileSync(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
