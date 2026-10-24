import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (Boolean(email) !== Boolean(password)) throw new Error('Both initial administrator secrets must be provided.');
const configured = [];
async function setCredential(name, value) {
  const response = await fetch(`https://api.render.com/v1/services/${process.env.RENDER_SERVICE_ID}/env-vars/${name}`, {
    method: value === undefined ? 'DELETE' : 'PUT',
    headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, 'Content-Type': 'application/json' },
    body: value === undefined ? undefined : JSON.stringify({ value }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Render setup request failed: HTTP ${response.status}`);
}
try {
  if (email && password) {
    for (const [name, value] of Object.entries({ BOOTSTRAP_ADMIN_EMAIL: email, BOOTSTRAP_ADMIN_PASSWORD: password })) {
      await setCredential(name, value);
      configured.push(name);
    }
  }
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./deploy-production.mjs', import.meta.url))], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error('Backend deployment did not succeed.');
  if (email && password) {
    const response = await fetch(new URL('/api/admin/login', process.env.RENDER_BACKEND_URL), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(30000),
    });
    const login = await response.json();
    if (!response.ok || !login.success || !login.token) throw new Error('Initial administrator sign-in verification failed.');
    const profile = await fetch(new URL('/api/admin/get_admin', process.env.RENDER_BACKEND_URL), {
      headers: { Authorization: `Bearer ${login.token}` }, signal: AbortSignal.timeout(30000),
    });
    const account = await profile.json();
    if (!profile.ok || account.data?.email !== email) throw new Error('Administrator profile verification failed.');
    console.log('Initial administrator sign-in and authenticated profile verified.');
  }
} finally {
  for (const name of configured) await setCredential(name);
  if (configured.length) console.log('Temporary administrator setup credentials removed from Render configuration.');
}
