const { RENDER_API_KEY, RENDER_SERVICE_ID, RENDER_BACKEND_URL, DEPLOY_SHA } = process.env;
if (![RENDER_API_KEY, RENDER_SERVICE_ID, RENDER_BACKEND_URL, DEPLOY_SHA].every(Boolean)) {
  throw new Error('Missing Render deployment configuration; deployment stopped.');
}
const base = `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys`;
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${RENDER_API_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Render request failed: HTTP ${response.status}`);
  return response.json();
}
const deploy = await api(base, { method: 'POST', body: JSON.stringify({ commitId: DEPLOY_SHA }) });
if (!deploy.id) throw new Error('Render did not return a deploy ID.');
const deadline = Date.now() + 25 * 60 * 1000;
let live = false;
while (Date.now() < deadline) {
  const state = await api(`${base}/${deploy.id}`);
  console.log(`Render deployment: ${state.status}`);
  if (state.status === 'live') { live = true; break; }
  if (['build_failed', 'update_failed', 'pre_deploy_failed', 'canceled', 'deactivated'].includes(state.status)) {
    throw new Error(`Render deployment failed: ${state.status}`);
  }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
if (!live) throw new Error('Render deployment timed out.');
const ready = await fetch(new URL('/ready', RENDER_BACKEND_URL), { signal: AbortSignal.timeout(60000) });
if (!ready.ok || (await ready.json()).status !== 'READY') throw new Error('Backend readiness check failed.');
console.log('Tested backend commit deployed and database is ready.');
