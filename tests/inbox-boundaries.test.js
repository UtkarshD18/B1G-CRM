const express = require('express');
const request = require('supertest');

const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery, withTransaction: jest.fn() }));
jest.mock('../middlewares/auth', () => ({
  validateUserOrAgent: (req, _res, next) => {
    req.decode = { uid: 'owner', permissions: req.headers['x-test-grant'] === 'none' ? [] : ['inbox.read', 'inbox.reply'] };
    if (req.headers['x-test-role'] === 'agent') req.agent = { uid: 'agent-a' };
    next();
  },
  verifyPermission: () => (_req, _res, next) => next(),
}));
jest.mock('../helper/inbox/inbox', () => ({ processMessage: jest.fn() }));

const router = require('../routes/inbox');
const app = express();
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use('/api/inbox', router);

beforeEach(() => mockQuery.mockReset());

test('agent inbox list uses tenant and assignment scope and omits contact placeholders', async () => {
  mockQuery.mockResolvedValue([{ chat_id: 'assigned-chat', uid: 'owner' }]);
  const response = await request(app).get('/api/inbox/get_chats').set('x-test-role', 'agent');
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expect(mockQuery).toHaveBeenCalledTimes(1);
  expect(mockQuery.mock.calls[0][0]).toContain('EXISTS (SELECT 1 FROM agent_chats');
  expect(mockQuery.mock.calls[0][1]).toEqual(['owner', 'agent-a']);
});

test('agent cannot read an unassigned conversation', async () => {
  mockQuery.mockResolvedValue([]);
  const response = await request(app).post('/api/inbox/get_convo')
    .set('x-test-role', 'agent').send({ chatId: 'other-chat' });
  expect(response.status).toBe(403);
  expect(response.body.data).toBeUndefined();
});

test('agent without inbox permission cannot list chats', async () => {
  const response = await request(app).get('/api/inbox/get_chats')
    .set('x-test-role', 'agent').set('x-test-grant', 'none');
  expect(response.status).toBe(403);
  expect(mockQuery).not.toHaveBeenCalled();
});

test('unsigned WhatsApp webhook does not reach the queue', async () => {
  const response = await request(app).post('/api/inbox/webhook/owner').send({ entry: [] });
  expect(response.status).toBe(401);
  expect(mockQuery).not.toHaveBeenCalled();
});
