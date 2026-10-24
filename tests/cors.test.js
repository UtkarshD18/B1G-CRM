const express = require('express');
const cors = require('cors');
const request = require('supertest');
const { createCorsOptions } = require('../utils/corsConfig');
const app = express();
app.use(cors(createCorsOptions(['https://omnicrms.app', 'https://omnicrms-app.web.app/'])));
app.get('/ready', (req, res) => res.json({status:'READY'}));

test.each(['https://omnicrms.app', 'https://omnicrms-app.web.app'])('allows API preflight from %s', async origin => {
  const response = await request(app).options('/api/admin/login')
    .set('Origin', origin).set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'authorization,content-type');
  expect(response.status).toBe(204);
  expect(response.headers['access-control-allow-origin']).toBe(origin);
  expect(response.headers['access-control-allow-credentials']).toBe('true');
  expect(response.headers['access-control-allow-headers']).toContain('authorization');
  expect(response.headers.vary).toContain('Origin');
});

test('does not grant browser access to an unlisted origin', async () => {
  const response = await request(app).get('/ready').set('Origin', 'https://untrusted.example.invalid');
  expect(response.headers['access-control-allow-origin']).toBeUndefined();
});

test('continues serving health probes without an Origin header', async () => {
  expect((await request(app).get('/ready')).body.status).toBe('READY');
});

test('rejects wildcard origins with credentials', () => {
  expect(() => createCorsOptions(['*'])).toThrow(/explicit origins/);
});
