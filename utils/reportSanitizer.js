/**
 * Report Sanitizer Utility
 *
 * Recursively walks objects and arrays to redact sensitive values
 * before writing report JSON files to disk.
 *
 * This prevents GitGuardian from detecting:
 * - JWTs (eyJ*.*.* patterns)
 * - Authorization headers
 * - Bearer tokens
 * - API keys
 * - Session tokens
 * - Cookies
 */

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'jwt',
  'bearer',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'x-api-key',
  'apikey',
  'api_key',
  'secret',
  'password',
  'session',
  'sessionid',
  'csrf',
  'x-csrf-token',
]);

// JWT pattern: three base64url segments separated by dots
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g;

// Bearer token in a URL query string or header value
const BEARER_PATTERN = /Bearer\s+\S+/gi;

// userToken=<value> in URLs
const URL_TOKEN_PATTERN = /(\buserToken=)[^&\s'"]+/gi;

function isSensitiveKey(key) {
  return SENSITIVE_KEYS.has(String(key).toLowerCase());
}

function redactString(str) {
  let result = str;
  result = result.replace(JWT_PATTERN, '<JWT_REDACTED>');
  result = result.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
  result = result.replace(URL_TOKEN_PATTERN, '$1[REDACTED]');
  return result;
}

function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitize(value);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Sanitize an object and return JSON string ready for writing to disk.
 */
function sanitizeToJson(obj, indent = 2) {
  return JSON.stringify(sanitize(obj), null, indent);
}

module.exports = { sanitize, sanitizeToJson, redactString };
