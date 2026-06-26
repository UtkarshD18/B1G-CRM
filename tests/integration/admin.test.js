const request = require('supertest');
const { app } = require('../../server');

describe('Admin API Integration Tests', () => {
  it('should reject access to admin routes for unauthenticated users', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard-stats');
    expect(res.status).toBe(401);
  });
});
