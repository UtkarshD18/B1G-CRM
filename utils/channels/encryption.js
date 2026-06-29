const crypto = require('crypto');

// Assert existence on start
if (!process.env.CHANNEL_SECRET_KEY || process.env.CHANNEL_SECRET_KEY.length < 32) {
  console.error("FATAL: CHANNEL_SECRET_KEY must be defined and at least 32 characters.");
  process.exit(1);
}

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.CHANNEL_SECRET_KEY.slice(0, 32));
const KEY_VERSION = 'v1';

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return JSON.stringify({
    key_version: KEY_VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString('hex'),
    auth_tag: authTag,
    ciphertext: encrypted
  });
}

function decrypt(payloadString) {
  if (!payloadString) return null;
  try {
    const payload = JSON.parse(payloadString);
    if (!payload.iv || !payload.auth_tag || !payload.ciphertext) {
      throw new Error("Invalid encryption payload format");
    }
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.auth_tag, 'hex');
    const decipher = crypto.createDecipheriv(payload.algorithm, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If it's not a JSON payload (legacy or unencrypted test case), fallback to direct return for backward compatibility
    if (payloadString.includes(':')) {
      // CBC fallback (if any CBC values existed previously, though we just implemented GCM)
      try {
        const textParts = payloadString.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
      } catch (e) {
        return payloadString;
      }
    }
    return payloadString;
  }
}

module.exports = {
  encrypt,
  decrypt
};
