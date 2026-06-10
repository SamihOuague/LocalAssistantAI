import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;

export type Encryptor = {
  encrypt: (plaintext: string) => string;
  decrypt: (blob: string) => string;
};

export function createEncryptor(key: Buffer): Encryptor {
  if (key.length !== KEY_LENGTH_BYTES)
  {
  	throw new Error(
  		`Encryption key must be exactly ${KEY_LENGTH_BYTES} bytes; got ${key.length}`,
  		);
  }

  return {
    encrypt(plaintext: string): string {
    	const iv = randomBytes(IV_LENGTH_BYTES);
      	const cipher = createCipheriv(ALGORITHM, key, iv);
      	const ciphertext = Buffer.concat([
          cipher.update(plaintext, 'utf8'),
          cipher.final(),
      	]);
      	const tag = cipher.getAuthTag();
      	return Buffer.concat([iv, tag, ciphertext]).toString('base64');
    	},

    decrypt(blob: string): string {
    	const buf = Buffer.from(blob, 'base64');
      	if (buf.length < IV_LENGTH_BYTES + TAG_LENGTH_BYTES)
	{
        	throw new Error('Ciphertext blob too short');
      	}
      	const iv = buf.subarray(0, IV_LENGTH_BYTES);
      	const tag = buf.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + TAG_LENGTH_BYTES);
      	const ciphertext = buf.subarray(IV_LENGTH_BYTES + TAG_LENGTH_BYTES);
      	const decipher = createDecipheriv(ALGORITHM, key, iv);
      	decipher.setAuthTag(tag);
      	const plaintext = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
      	]);
      	return plaintext.toString('utf8');
    },
  };
}
