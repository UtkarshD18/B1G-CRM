jest.mock('axios', () => jest.fn());

const axios = require('axios');
const { isPrivateIp, resolveSafeTarget, safeHttpRequest } = require('../utils/ssrfFilter');

describe('outbound URL safety', () => {
  test.each([
    '127.0.0.1', '10.3.4.5', '100.64.1.1', '169.254.169.254',
    '172.16.0.1', '192.168.0.2', '::1', 'fc00::1', '::ffff:127.0.0.1',
  ])('blocks private address %s', (address) => {
    expect(isPrivateIp(address)).toBe(true);
  });

  test('rejects any private DNS answer, even if another answer is public', async () => {
    const resolver = jest.fn().mockResolvedValue([
      { address: '93.184.215.14', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);
    await expect(resolveSafeTarget('https://example.org/page', resolver)).rejects.toThrow('Blocked');
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  test.each(['http://localhost/', 'http://[::ffff:127.0.0.1]/', 'file:///etc/passwd', 'https://user:pass@example.org/'])('rejects unsafe URL %s', async (url) => {
    await expect(resolveSafeTarget(url)).rejects.toThrow();
  });

  test('pins the checked address and disables redirects and proxies', async () => {
    axios.mockResolvedValue({ status: 200, data: 'ok' });
    const resolver = jest.fn().mockResolvedValue([{ address: '93.184.215.14', family: 4 }]);
    await safeHttpRequest('https://example.org/page', { resolver, method: 'GET', maxRedirects: 12 });
    const config = axios.mock.calls.at(-1)[0];
    expect(config.url).toBe('https://example.org/page');
    expect(config.maxRedirects).toBe(0);
    expect(config.proxy).toBe(false);
    expect(config.timeout).toBe(10000);
    expect(config.maxContentLength).toBe(1024 * 1024);
    await new Promise((resolve, reject) => config.httpsAgent.options.lookup('example.org', {}, (error, address, family) => {
      if (error) reject(error);
      else {
        expect([address, family]).toEqual(['93.184.215.14', 4]);
        resolve();
      }
    }));
    expect(resolver).toHaveBeenCalledTimes(1);
  });
});
