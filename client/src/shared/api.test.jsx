describe('Hosted API requests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete window.__B1GCRM_API_URL__;
    jest.resetModules();
  });

  test('sends admin login to the configured backend origin', async () => {
    window.__B1GCRM_API_URL__ = 'https://api.example.invalid/';
    global.fetch = jest.fn().mockResolvedValue({ text: async () => JSON.stringify({ msg: 'Invalid credentials' }) });
    const { apiRequest } = require('./api');
    const result = await apiRequest('/api/admin/login', {
      method: 'POST', body: { email: 'test@example.invalid', password: 'test' },
    });
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.invalid/api/admin/login', expect.objectContaining({method: 'POST'}));
    expect(result.msg).toBe('Invalid credentials');
  });

  test('does not display an HTML fallback as a login error', async () => {
    global.fetch = jest.fn().mockResolvedValue({status: 200, text: async () => '<!doctype html><html>Frontend fallback</html>'});
    const { apiRequest } = require('./api');
    const result = await apiRequest('/api/admin/login');
    expect(result.success).toBe(false);
    expect(result.msg).toMatch(/refresh/i);
    expect(result.msg).not.toContain('<html>');
  });

  test('explains a temporary backend outage', async () => {
    global.fetch = jest.fn().mockResolvedValue({status: 503, text: async () => '<html>Service starting</html>'});
    const { apiRequest } = require('./api');
    expect((await apiRequest('/api/admin/login')).msg).toMatch(/try again in a minute/i);
  });
});
