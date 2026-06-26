const request = require('supertest');
const { app } = require('../../server');

describe('Inbox & Webhook Handlers Integration Tests', () => {
  it('should return 401 for inbox history fetch without tenant token', async () => {
    const res = await request(app).get('/api/v1/inbox/get_chats');
    expect(res.status).toBe(401);
  });
});
