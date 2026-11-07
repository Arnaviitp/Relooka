const crypto = require('crypto');
const env = require('../config/env');

// LEGAL COMPLIANCE NOTE:
// Legal team must review and confirm ID storage policies, retention periods,
// and user consent text before deploying to production. Full ID numbers and images
// must NEVER be stored. Only store ID type, masked reference (<=4 characters),
// and name as printed on card.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from the configured ENCRYPTION_KEY string
 */
function getEncryptionKey() {
  const hex = env.ENCRYPTION_KEY;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, 'hex');
  }
  // Fallback safe 32-byte hash
  return crypto.createHash('sha256').update(String(hex || 'loopwear-default-secret-key-32b')).digest();
}

/**
 * Encrypt sensitive plain text at rest using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} iv:tag:ciphertext in hex
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM encrypted text
 * @param {string} encryptedText - iv:tag:ciphertext in hex
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return encryptedText;
  }
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:tag:ciphertext');
  }
  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Hash an OTP or token for secure comparison
 * @param {string} data
 * @returns {string} sha256 hex
 */
function hashToken(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

/**
 * Mask an ID string to keep only the last 4 characters max
 * e.g. "123456789012" -> "XXXX9012"
 * @param {string} raw
 * @returns {string}
 */
function maskId(raw) {
  if (!raw) return '';
  const clean = String(raw).trim();
  const last4 = clean.slice(-4);
  return `XXXX${last4}`;
}

module.exports = {
  encrypt,
  decrypt,
  generateOtp,
  hashToken,
  maskId
};

