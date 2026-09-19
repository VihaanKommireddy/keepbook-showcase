import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_STATE, backupsDir, readState, writeState } from './state.js';

let dataDir: string;
beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'keepbook-backup-state-'));
});
afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true });
});

describe('state.json', () => {
  it('reads empty when nothing has run yet', () => {
    expect(readState(dataDir)).toEqual(EMPTY_STATE);
    expect(existsSync(backupsDir(dataDir))).toBe(false);
  });

  it('round-trips and creates the backups folder', () => {
    writeState(dataDir, {
      lastRunAt: '2026-09-13T08:00:03Z',
      lastOkAt: '2026-09-13T08:00:03Z',
      lastError: null,
      lastArchive: 'keepbook-2026-09-13T0800Z.tar.gz.enc',
      lastUploadedKey: 'keepbook/keepbook-2026-09-13T0800Z.tar.gz.enc',
    });
    expect(readState(dataDir).lastArchive).toBe('keepbook-2026-09-13T0800Z.tar.gz.enc');
    expect(JSON.parse(readFileSync(join(backupsDir(dataDir), 'state.json'), 'utf8')).lastError).toBeNull();
  });

  it('tolerates a corrupt or partial file', () => {
    mkdirSync(backupsDir(dataDir), { recursive: true });
    writeFileSync(join(backupsDir(dataDir), 'state.json'), '{not json');
    expect(readState(dataDir)).toEqual(EMPTY_STATE);
    writeFileSync(join(backupsDir(dataDir), 'state.json'), '{"lastOkAt":"2026-09-13T08:00:03Z"}');
    expect(readState(dataDir)).toEqual({ ...EMPTY_STATE, lastOkAt: '2026-09-13T08:00:03Z' });
  });
});
