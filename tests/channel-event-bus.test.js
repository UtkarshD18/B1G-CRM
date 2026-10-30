const eventBus = require('../utils/channels/eventBus');

afterEach(() => eventBus.removeAllListeners('synthetic_message'));

test('waits for async handlers before resolving', async () => {
  const order = [];
  eventBus.on('synthetic_message', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    order.push('persisted');
  });
  await eventBus.emitAsync('synthetic_message', {});
  expect(order).toEqual(['persisted']);
});

test('surfaces a handler failure to the caller', async () => {
  eventBus.on('synthetic_message', async () => { throw new Error('disk failed'); });
  await expect(eventBus.emitAsync('synthetic_message', {})).rejects.toThrow('disk failed');
});
