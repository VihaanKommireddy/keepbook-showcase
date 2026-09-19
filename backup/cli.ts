/**
 * Operator CLI for the backup job. Two commands:
 *
 *   run                         one backup now (same code path as the nightly job)
 *   restore <archive> <target>  decrypt + unpack into <target>, which must be
 *                               new or empty; then boot the server with
 *                               KEEPBOOK_DB=<target>/keepbook.db
 *
 * From source: `npm run backup -w server` / `npm run backup:restore -w server -- <archive> <target>`.
 * Built:       `node server/dist/backup/cli.js run` / `… restore <archive> <target>`.
 */
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import pkg from '../../package.json' with { type: 'json' };
import { nowIso } from '../core/time.js';
import { restoreArchive, runBackup } from './archive.js';
import { resolveBackupConfig } from './config.js';
import { createS3Store } from './s3.js';

const here = dirname(fileURLToPath(import.meta.url));
// src/backup/cli.ts and dist/backup/cli.js sit at the same depth: <repo>/server/<src|dist>/backup/
const repoRoot = resolve(here, '..', '..', '..');

function dataDirFromEnv(env: NodeJS.ProcessEnv): string {
  const dbPath = env.KEEPBOOK_DB !== undefined && env.KEEPBOOK_DB !== '' ? env.KEEPBOOK_DB : join(repoRoot, 'data', 'keepbook.db');
  return dirname(dbPath);
}

// stderr, not stdout: `restore … > log.txt` must never put the passphrase in
// the redirected file. The answer is returned as typed, not trimmed — a
// passphrase may legitimately have leading/trailing spaces, and silently
// stripping them would make a correctly-typed passphrase fail to decrypt.
// Note: with a non-TTY stdin (piped input, a CI job) this prompt never
// resolves — set KEEPBOOK_BACKUP_PASSPHRASE instead.
async function askPassphrase(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return await rl.question('Passphrase (shown as you type): ');
  } finally {
    rl.close();
  }
}

function usage(): never {
  console.error('usage: backup-cli run | restore <archive> <targetDir>');
  process.exit(1);
}

async function main(argv: string[]): Promise<number> {
  const cmd = argv[0];
  if (cmd === 'run') {
    const cfg = resolveBackupConfig(process.env, 'production');
    const dataDir = dataDirFromEnv(process.env);
    // s3 is defined whenever store is (store is created FROM s3, right here) —
    // building both inside the same `s3 !== undefined` check, instead of a
    // separate `store` variable, lets TS see that prefix is always a string.
    const s3 = cfg.s3;
    const storeExtras = s3 !== undefined ? { store: createS3Store(s3), prefix: s3.prefix } : {};
    const result = await runBackup({
      dataDir,
      appVersion: pkg.version,
      keep: cfg.keep,
      ...(cfg.passphrase !== undefined ? { passphrase: cfg.passphrase } : {}),
      ...storeExtras,
      now: nowIso,
      log: (m) => console.log(m),
      error: (m) => console.error(m),
    });
    if (!result.ok) {
      console.error(`FAILED: ${result.error}${result.archive !== undefined ? ` (local archive: ${result.archive})` : ''}`);
      return 1;
    }
    console.log(`archive: ${result.archive}`);
    console.log(`bytes: ${result.bytes}`);
    console.log(result.uploadedKey !== undefined ? `uploaded: ${result.uploadedKey}` : 'uploaded: no (local only)');
    return 0;
  }
  if (cmd === 'restore') {
    const archive = argv[1];
    const target = argv[2];
    if (archive === undefined || target === undefined) usage();
    const fromEnv = process.env.KEEPBOOK_BACKUP_PASSPHRASE;
    const passphrase =
      fromEnv !== undefined && fromEnv !== '' ? fromEnv : archive.endsWith('.enc') ? await askPassphrase() : undefined;
    const manifest = restoreArchive(resolve(archive), resolve(target), passphrase !== undefined ? { passphrase } : {});
    console.log(`restored ${basename(archive)} (taken ${manifest.createdAt}, app v${manifest.appVersion}) into ${resolve(target)}`);
    for (const f of manifest.files) console.log(`  ${f.path}  ${f.bytes} bytes`);
    console.log(`\nnext: start the server with KEEPBOOK_DB=${join(resolve(target), 'keepbook.db')}`);
    return 0;
  }
  return usage();
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  },
);
