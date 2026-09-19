/**
 * <dataDir>/backups/state.json — what the last run did. Written after every
 * run, success or failure; read by /api/health and by the boot catch-up.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BackupMode } from './config.js';

export interface BackupState {
  lastRunAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  lastArchive: string | null;
  lastUploadedKey: string | null;
}

export const EMPTY_STATE: BackupState = {
  lastRunAt: null,
  lastOkAt: null,
  lastError: null,
  lastArchive: null,
  lastUploadedKey: null,
};

/** What /api/health reports. */
export interface BackupStatus {
  mode: BackupMode;
  lastOkAt: string | null;
  lastError: string | null;
}

export function backupsDir(dataDir: string): string {
  return join(dataDir, 'backups');
}

function statePath(dataDir: string): string {
  return join(backupsDir(dataDir), 'state.json');
}

function nullableString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export function readState(dataDir: string): BackupState {
  const path = statePath(dataDir);
  if (!existsSync(path)) return { ...EMPTY_STATE };
  try {
    const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
    const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    return {
      lastRunAt: nullableString(obj.lastRunAt),
      lastOkAt: nullableString(obj.lastOkAt),
      lastError: nullableString(obj.lastError),
      lastArchive: nullableString(obj.lastArchive),
      lastUploadedKey: nullableString(obj.lastUploadedKey),
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function writeState(dataDir: string, state: BackupState): void {
  mkdirSync(backupsDir(dataDir), { recursive: true });
  const path = statePath(dataDir);
  // Write-then-rename: a crash or a concurrent read mid-write never sees a
  // truncated/partial state.json — rename is atomic on the same filesystem.
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
  renameSync(tmp, path);
}
