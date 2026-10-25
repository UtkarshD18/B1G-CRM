process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://omnicrm@localhost:5432/omnicrm';
process.env.NODE_ENV = 'test';
process.env.CHANNEL_SECRET_KEY = 'test-channel-secret-key-at-least-32-chars-long';
