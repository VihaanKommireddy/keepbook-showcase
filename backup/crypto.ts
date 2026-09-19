/**
 * Archive encryption. Format "KBK1":
 *
 *   KBK1 (4 bytes) | salt (16) | iv (12) | ciphertext | GCM tag (16)
 *
 * AES-256-GCM with a key derived by scrypt from the operator's passphrase.
 * Node's built-in crypto only — no dependency. Buffer-based on purpose:
 * archives are small (kilobytes to a few megabytes for a long time) and a
 * streaming GCM decrypt has to read the trailing tag first anyway.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const MAGIC = Buffer.from('KBK1');
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const HEADER_LEN = MAGIC.length + SALT_LEN + IV_LEN;

export const BAD_PASSPHRASE = 'bad passphrase or corrupt archive';
export const NOT_KBK1 = 'not a KBK1 archive';

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
}

export function isKbk1(buf: Buffer): boolean {
  return buf.length >= MAGIC.length && buf.subarray(0, MAGIC.length).equals(MAGIC);
}

export function encryptKbk1(plain: Buffer, passphrase: string): Buffer {
  if (passphrase === '') throw new Error('passphrase must not be empty');
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, body, cipher.getAuthTag()]);
}

export function decryptKbk1(buf: Buffer, passphrase: string): Buffer {
  if (!isKbk1(buf) || buf.length < HEADER_LEN + TAG_LEN) throw new Error(NOT_KBK1);
  const salt = buf.subarray(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = buf.subarray(MAGIC.length + SALT_LEN, HEADER_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const body = buf.subarray(HEADER_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch {
    throw new Error(BAD_PASSPHRASE);
  }
}
