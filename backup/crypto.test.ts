/** KBK1 = "KBK1" + salt(16) + iv(12) + ciphertext + tag(16), AES-256-GCM, scrypt key. */
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BAD_PASSPHRASE, NOT_KBK1, decryptKbk1, encryptKbk1, isKbk1 } from './crypto.js';

describe('KBK1', () => {
  const plain = Buffer.from('the whole book, gzipped, would go here');

  it('round-trips and the header is the magic bytes', () => {
    const enc = encryptKbk1(plain, 'correct horse');
    expect(enc.subarray(0, 4).toString()).toBe('KBK1');
    expect(enc.length).toBe(4 + 16 + 12 + plain.length + 16);
    expect(isKbk1(enc)).toBe(true);
    expect(isKbk1(plain)).toBe(false);
    expect(decryptKbk1(enc, 'correct horse').equals(plain)).toBe(true);
  });

  it('two encryptions of the same bytes differ (fresh salt + iv)', () => {
    const a = encryptKbk1(plain, 'p');
    const b = encryptKbk1(plain, 'p');
    expect(a.equals(b)).toBe(false);
  });

  it('wrong passphrase fails with the documented message', () => {
    const enc = encryptKbk1(plain, 'right');
    expect(() => decryptKbk1(enc, 'wrong')).toThrow(BAD_PASSPHRASE);
  });

  it('a flipped byte in the body fails the same way', () => {
    const enc = encryptKbk1(plain, 'p');
    const at = 4 + 16 + 12 + 3;
    enc[at] = (enc[at] ?? 0) ^ 0xff;
    expect(() => decryptKbk1(enc, 'p')).toThrow(BAD_PASSPHRASE);
  });

  it('truncated input fails', () => {
    const enc = encryptKbk1(plain, 'p');
    expect(() => decryptKbk1(enc.subarray(0, enc.length - 5), 'p')).toThrow(BAD_PASSPHRASE);
    expect(() => decryptKbk1(enc.subarray(0, 20), 'p')).toThrow(NOT_KBK1);
  });

  it('refuses a non-KBK1 buffer and an empty passphrase', () => {
    expect(() => decryptKbk1(randomBytes(64), 'p')).toThrow(NOT_KBK1);
    expect(() => encryptKbk1(plain, '')).toThrow(/empty/);
  });

  it('handles an empty plaintext', () => {
    const enc = encryptKbk1(Buffer.alloc(0), 'p');
    expect(decryptKbk1(enc, 'p').length).toBe(0);
  });
});
