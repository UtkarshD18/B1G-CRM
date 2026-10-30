const dns = require('dns').promises;
const net = require('net');
const http = require('http');
const https = require('https');
const axios = require('axios');

const blocked = new net.BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10],
  ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(network, prefix, 'ipv4');
for (const [network, prefix] of [
  ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10],
  ['ff00::', 8],
]) blocked.addSubnet(network, prefix, 'ipv6');

function isPrivateIp(ipAddress) {
  const ip = String(ipAddress || '').replace(/^\[|\]$/g, '');
  const family = net.isIP(ip);
  return !family || (family === 6 && ip.toLowerCase().startsWith('::ffff:')) ||
    blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}

async function resolveSafeTarget(urlString, resolver = dns.lookup) {
  const parsed = new URL(urlString);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Invalid outbound URL');
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || /\.(localhost|local|internal|invalid|test)$/.test(hostname)) {
    throw new Error('Blocked outbound destination');
  }
  const addresses = net.isIP(hostname)
    ? [{ address: hostname, family: net.isIP(hostname) }]
    : await resolver(hostname, { all: true, verbatim: true });
  if (!Array.isArray(addresses) || !addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('Blocked outbound destination');
  }
  return { url: parsed.toString(), hostname, address: addresses[0].address, family: addresses[0].family };
}

async function isSafeUrl(urlString, resolver) {
  try {
    await resolveSafeTarget(urlString, resolver);
    return true;
  } catch {
    return false;
  }
}

async function safeHttpRequest(urlString, options = {}) {
  const { resolver, ...requestOptions } = options;
  const target = await resolveSafeTarget(urlString, resolver || dns.lookup);
  const lookup = (hostname, lookupOptions, callback) => {
    if (hostname.toLowerCase() !== target.hostname) {
      callback(new Error('Unexpected outbound hostname'));
      return;
    }
    const address = { address: target.address, family: target.family };
    if (lookupOptions?.all) callback(null, [address]);
    else callback(null, address.address, address.family);
  };
  return axios({
    ...requestOptions,
    url: target.url,
    timeout: 10000,
    maxRedirects: 0,
    maxContentLength: 1024 * 1024,
    maxBodyLength: 1024 * 1024,
    proxy: false,
    validateStatus: (status) => status >= 200 && status < 300,
    httpAgent: new http.Agent({ lookup, keepAlive: false }),
    httpsAgent: new https.Agent({ lookup, keepAlive: false }),
  });
}

module.exports = { isPrivateIp, isSafeUrl, resolveSafeTarget, safeHttpRequest };
