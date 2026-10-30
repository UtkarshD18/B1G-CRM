const crypto = require('crypto');

// Meta signs the bytes received on the wire. Re-serializing req.body changes
// those bytes and makes validation unreliable.
function hasValidMetaSignature(rawBody, header, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret || typeof header !== 'string') return false;
  if (!/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const supplied = Buffer.from(header.slice(7), 'hex');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

module.exports = { hasValidMetaSignature };
