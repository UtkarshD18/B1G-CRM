const request = require('supertest');
const { app } = require('../../server');

describe('Authentication & Authorization Integration Tests', () => {
  it('should reject requests without a token on protected routes', async () => {
    const res = await request(app).get('/api/user/get_me');
    expect(res.status).toBe(401);
    expect(res.body.msg).toMatch(/missing/i);
  });

  it('should reject requests with malformed tokens', async () => {
    const res = await request(app)
      .get('/api/user/get_me')
      .set('Authorization', 'Bearer invalid.token.value');
    expect(res.status).toBe(401);
    expect(res.body.msg).toMatch(/invalid/i);
  });
});
