const crypto = require('crypto');
const { hasValidMetaSignature } = require('../utils/metaWebhookSignature');

const secret = 'test-only-secret';
const body = Buffer.from('{"entry":[{"id":"synthetic"}]}');
const sign = (bytes) => `sha256=${crypto.createHmac('sha256', secret).update(bytes).digest('hex')}`;

test('accepts the signed raw bytes', () => {
  expect(hasValidMetaSignature(body, sign(body), secret)).toBe(true);
});

test.each([
  ['missing signature', undefined, secret],
  ['missing secret', sign(body), undefined],
  ['truncated signature', sign(body).slice(0, -2), secret],
  ['wrong signature', sign(Buffer.from('{}')), secret],
  ['wrong algorithm', sign(body).replace('sha256=', 'sha1='), secret],
])('rejects %s', (_label, header, configuredSecret) => {
  expect(hasValidMetaSignature(body, header, configuredSecret)).toBe(false);
});

test('does not accept a signature over re-serialized JSON', () => {
  expect(hasValidMetaSignature(body, sign(Buffer.from(JSON.stringify(JSON.parse(body.toString()), null, 2))), secret)).toBe(false);
});
