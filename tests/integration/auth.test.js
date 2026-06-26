const request = require('supertest');
const { app } = require('../../server');

describe('Authentication & Authorization Integration Tests', () => {
  it('should reject requests without a token on protected routes', async () => {
    const res = await request(app).get('/api/v1/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Access denied/i);
  });

  it('should reject requests with malformed tokens', async () => {
    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer invalid.token.value');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Invalid token/i);
  });
});
