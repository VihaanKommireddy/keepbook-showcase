import { describe, expect, it } from 'vitest';
import { DEFAULT_S3_PREFIX, backupMode, resolveBackupConfig } from './config.js';

const S3 = {
  KEEPBOOK_BACKUP_S3_ENDPOINT: 'https://s3.us-west-004.backblazeb2.com',
  KEEPBOOK_BACKUP_S3_BUCKET: 'keepbook-backups',
  KEEPBOOK_BACKUP_S3_ACCESS_KEY_ID: 'id',
  KEEPBOOK_BACKUP_S3_SECRET_ACCESS_KEY: 'secret',
};

describe('resolveBackupConfig', () => {
  it('defaults: on in production, 08:00, keep 7, no passphrase, no bucket', () => {
    const c = resolveBackupConfig({}, 'production');
    expect(c).toEqual({ enabled: true, timeUtc: '08:00', keep: 7, passphrase: undefined, s3: undefined });
    expect(backupMode(c)).toBe('local');
  });

  it('is off in development and test unless forced on', () => {
    expect(resolveBackupConfig({}, 'development').enabled).toBe(false);
    expect(resolveBackupConfig({}, 'test').enabled).toBe(false);
    expect(resolveBackupConfig({ KEEPBOOK_BACKUP: '1' }, 'development').enabled).toBe(true);
    expect(backupMode(resolveBackupConfig({}, 'development'))).toBe('off');
  });

  it('KEEPBOOK_BACKUP=0 turns it off even in production', () => {
    expect(resolveBackupConfig({ KEEPBOOK_BACKUP: '0' }, 'production').enabled).toBe(false);
  });

  it('reads time, keep, passphrase', () => {
    const c = resolveBackupConfig(
      { KEEPBOOK_BACKUP_TIME_UTC: '03:30', KEEPBOOK_BACKUP_KEEP: '14', KEEPBOOK_BACKUP_PASSPHRASE: 'pp' },
      'production',
    );
    expect(c.timeUtc).toBe('03:30');
    expect(c.keep).toBe(14);
    expect(c.passphrase).toBe('pp');
  });

  it('rejects a bad time or keep', () => {
    expect(() => resolveBackupConfig({ KEEPBOOK_BACKUP_TIME_UTC: '8am' }, 'production')).toThrow(/HH:MM/);
    expect(() => resolveBackupConfig({ KEEPBOOK_BACKUP_KEEP: '0' }, 'production')).toThrow(/KEEPBOOK_BACKUP_KEEP/);
    expect(() => resolveBackupConfig({ KEEPBOOK_BACKUP_KEEP: 'many' }, 'production')).toThrow(/KEEPBOOK_BACKUP_KEEP/);
  });

  it('a complete S3 block gives off-site mode with defaults for region and prefix', () => {
    const c = resolveBackupConfig({ ...S3, KEEPBOOK_BACKUP_PASSPHRASE: 'pp' }, 'production');
    expect(c.s3).toEqual({
      endpoint: S3.KEEPBOOK_BACKUP_S3_ENDPOINT,
      bucket: 'keepbook-backups',
      region: 'us-east-1',
      accessKeyId: 'id',
      secretAccessKey: 'secret',
      prefix: 'keepbook/',
    });
    expect(backupMode(c)).toBe('off-site');
  });

  it('region and prefix are overridable', () => {
    const c = resolveBackupConfig(
      { ...S3, KEEPBOOK_BACKUP_S3_REGION: 'us-west-004', KEEPBOOK_BACKUP_S3_PREFIX: 'prod/' },
      'production',
    );
    expect(c.s3?.region).toBe('us-west-004');
    expect(c.s3?.prefix).toBe('prod/');
  });

  it('a partial S3 block is an error naming the missing variables', () => {
    const { KEEPBOOK_BACKUP_S3_SECRET_ACCESS_KEY: _omit, ...partial } = S3;
    expect(() => resolveBackupConfig(partial, 'production')).toThrow(
      'backup: S3 config is incomplete, missing KEEPBOOK_BACKUP_S3_SECRET_ACCESS_KEY',
    );
  });

  it('an empty string counts as unset', () => {
    expect(resolveBackupConfig({ KEEPBOOK_BACKUP_PASSPHRASE: '' }, 'production').passphrase).toBeUndefined();
    expect(resolveBackupConfig({ KEEPBOOK_BACKUP_S3_BUCKET: '' }, 'production').s3).toBeUndefined();
  });

  it('normalizes a prefix that is missing its trailing slash', () => {
    const c = resolveBackupConfig({ ...S3, KEEPBOOK_BACKUP_S3_PREFIX: 'prod' }, 'production');
    expect(c.s3?.prefix).toBe('prod/');
  });

  it('an empty prefix counts as unset and falls back to the default', () => {
    const c = resolveBackupConfig({ ...S3, KEEPBOOK_BACKUP_S3_PREFIX: '' }, 'production');
    expect(c.s3?.prefix).toBe(DEFAULT_S3_PREFIX);
    expect(DEFAULT_S3_PREFIX).toBe('keepbook/');
  });
});
