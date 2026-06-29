const crypto = require("crypto");
const env = require("../env");

const ALGORITHM = "aes-256-cbc";

// 32-byte key derived from JWT_SECRET or a fallback
const ENCRYPTION_KEY = crypto.scryptSync(env.JWT_SECRET || "fallback-secret-b1gcrm-key", "salt", 32);

/**
 * Encrypts a plain text string using AES-256-CBC.
 * @param {string} text - The plain text string.
 * @returns {string} The encrypted string in format iv:encryptedData
 */
function encryptKey(text) {
  if (!text) return text;
  
  // Don't double encrypt
  if (text.includes(":") && text.length > 32) {
    try {
      decryptKey(text); // Test if it's already a valid encrypted string
      return text;
    } catch {
      // Not a valid encrypted string, proceed to encrypt
    }
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts an encrypted string.
 * @param {string} encryptedText - The string in format iv:encryptedData
 * @returns {string} The decrypted plain text.
 */
function decryptKey(encryptedText) {
  if (!encryptedText) return encryptedText;
  if (encryptedText === "••••••••••••••••") return encryptedText; // masked payload
  
  try {
    const textParts = encryptedText.split(":");
    if (textParts.length !== 2) return encryptedText; // Plain text or invalid

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Return original if decryption fails (might be a plain text legacy value)
    return encryptedText;
  }
}

module.exports = {
  encryptKey,
  decryptKey
};
