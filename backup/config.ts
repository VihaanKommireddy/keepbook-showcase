/**
 * Backup settings from the environment. Anything malformed throws at boot
 * (a backup that silently ran in the wrong mode is worse than a server that
 * refuses to start). Names and defaults: docs/DEPLOY.md and .env.example.
 */
import { parseHhMm } from './schedule.js';

export interface S3Config {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Key prefix, e.g. 'keepbook/'. */
  prefix: string;
}

export interface BackupConfig {
  enabled: boolean;
  /** HH:MM UTC. */
  timeUtc: string;
  /** Local archives to keep. */
  keep: number;
  passphrase: string | undefined;
  s3: S3Config | undefined;
}

export type BackupMode = 'off' | 'local' | 'off-site';

export const DEFAULT_S3_PREFIX = 'keepbook/';

export function backupMode(c: BackupConfig): BackupMode {
  if (!c.enabled) return 'off';
  return c.s3 === undefined ? 'local' : 'off-site';
}

const S3_REQUIRED = [
  'KEEPBOOK_BACKUP_S3_ENDPOINT',
  'KEEPBOOK_BACKUP_S3_BUCKET',
  'KEEPBOOK_BACKUP_S3_ACCESS_KEY_ID',
  'KEEPBOOK_BACKUP_S3_SECRET_ACCESS_KEY',
] as const;

function read(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const v = env[name];
  return v === undefined || v === '' ? undefined : v;
}

/** A prefix is a key namespace, so it must end with '/'; unset -> the default. */
function normalizePrefix(raw: string | undefined): string {
  if (raw === undefined) return DEFAULT_S3_PREFIX;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export function resolveBackupConfig(
  env: NodeJS.ProcessEnv,
  nodeEnv: 'development' | 'production' | 'test',
): BackupConfig {
  const flag = read(env, 'KEEPBOOK_BACKUP');
  const enabled = flag === '1' ? true : flag === '0' ? false : nodeEnv === 'production';

  const timeUtc = read(env, 'KEEPBOOK_BACKUP_TIME_UTC') ?? '08:00';
  parseHhMm(timeUtc);

  const keepRaw = read(env, 'KEEPBOOK_BACKUP_KEEP');
  const keep = keepRaw === undefined ? 7 : Number(keepRaw);
  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error(`KEEPBOOK_BACKUP_KEEP must be a whole number of 1 or more, got "${keepRaw ?? ''}"`);
  }

  const passphrase = read(env, 'KEEPBOOK_BACKUP_PASSPHRASE');

  const present = S3_REQUIRED.filter((n) => read(env, n) !== undefined);
  let s3: S3Config | undefined;
  if (present.length === S3_REQUIRED.length) {
    s3 = {
      endpoint: read(env, 'KEEPBOOK_BACKUP_S3_ENDPOINT') ?? '',
      bucket: read(env, 'KEEPBOOK_BACKUP_S3_BUCKET') ?? '',
      region: read(env, 'KEEPBOOK_BACKUP_S3_REGION') ?? 'us-east-1',
      accessKeyId: read(env, 'KEEPBOOK_BACKUP_S3_ACCESS_KEY_ID') ?? '',
      secretAccessKey: read(env, 'KEEPBOOK_BACKUP_S3_SECRET_ACCESS_KEY') ?? '',
      prefix: normalizePrefix(read(env, 'KEEPBOOK_BACKUP_S3_PREFIX')),
    };
  } else if (present.length > 0) {
    const missing = S3_REQUIRED.filter((n) => !present.includes(n));
    throw new Error(`backup: S3 config is incomplete, missing ${missing.join(', ')}`);
  }

  return { enabled, timeUtc, keep, passphrase, s3 };
}
