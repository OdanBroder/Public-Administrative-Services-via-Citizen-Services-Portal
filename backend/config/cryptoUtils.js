import crypto from 'crypto';
import tpmService from '../utils/crypto/tpmController.js';
// IMPORTANT: Store this key securely. Do not hardcode in a real application.
// Consider using environment variables or a key management service.
const {key} = await tpmService.unsealAESKey();
const ENCRYPTION_KEY = key;
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(12); // GCM recommended IV size is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate IV, encrypted data, and AuthTag
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

function decrypt(encryptedBase64) {
  const combined = Buffer.from(encryptedBase64, 'base64');
  const iv = combined.slice(0, 12); // IV is 12 bytes
  const authTag = combined.slice(12, 28); // AuthTag is 16 bytes (from GCM)
  const encryptedData = combined.slice(28);

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString();
}

export { encrypt, decrypt };

