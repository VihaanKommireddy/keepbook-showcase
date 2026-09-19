/**
 * The off-site store. Any S3-compatible endpoint (Backblaze B2, Cloudflare
 * R2, AWS itself) through the standard client; path-style addressing because
 * B2 and R2 both accept it and virtual-host style needs DNS games. No unit
 * test: this file is a thin adapter, and the ObjectStore interface is what
 * archive.test.ts exercises with a fake.
 */
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { S3Config } from './config.js';

export interface ObjectStore {
  put(key: string, body: Buffer): Promise<void>;
  /** Size of the stored object, or null when it does not exist. */
  head(key: string): Promise<{ bytes: number } | null>;
}

export function createS3Store(cfg: S3Config): ObjectStore {
  const client = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    forcePathStyle: true,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    // The SDK's default (WHEN_SUPPORTED) sends a CRC32 request checksum on
    // every call; some S3-compatible providers reject it (Backblaze B2
    // documented this in 2025). WHEN_REQUIRED only sends/validates checksums
    // when an operation demands one, and is safe on real AWS too.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    async put(key, body) {
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: body,
          ContentLength: body.length,
          ContentType: 'application/octet-stream',
        }),
      );
    },
    async head(key) {
      try {
        const r = await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
        return { bytes: r.ContentLength ?? -1 };
      } catch (err) {
        const name = (err as { name?: string }).name;
        if (name === 'NotFound' || name === 'NoSuchKey') return null;
        throw err;
      }
    },
  };
}
