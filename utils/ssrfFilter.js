const net = require('net');
const { URL } = require('url');

function isPrivateIp(ipAddress) {
  if (!ipAddress) return true;

  // IPv4 Private Ranges
  const parts = ipAddress.split('.').map(Number);
  if (parts.length === 4) {
    const [p1, p2] = parts;
    if (p1 === 10) return true;
    if (p1 === 127) return true;
    if (p1 === 169 && p2 === 254) return true;
    if (p1 === 192 && p2 === 168) return true;
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
    if (p1 === 0) return true;
  }

  // IPv6 Private Ranges
  if (ipAddress === '::1' || ipAddress === '::') return true;
  const ipLower = ipAddress.toLowerCase();
  if (ipLower.startsWith('fe80:')) return true;
  if (ipLower.startsWith('fc00:')) return true;
  if (ipLower.startsWith('fd00:')) return true;

  return false;
}

async function isSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;

    // Block common local/private hostnames and loopbacks
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Check if it's an IP address directly
    if (net.isIP(hostname)) {
      return !isPrivateIp(hostname);
    }

    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  isPrivateIp,
  isSafeUrl,
};
