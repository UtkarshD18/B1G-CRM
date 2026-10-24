// HTTP and Socket.IO share the same exact-origin allowlist.
function createCorsOptions(origins) {
  const allowed = new Set(origins.map(origin => origin.trim().replace(/\/$/, '')).filter(Boolean));
  if (allowed.has('*')) throw new Error('CORS_ORIGINS must contain explicit origins when credentials are enabled');
  return {
    origin(origin, callback) {
      // Health probes, provider webhooks, and other server clients may omit Origin.
      callback(null, !origin || allowed.has(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Correlation-ID'],
    maxAge: 600,
    optionsSuccessStatus: 204,
  };
}

module.exports = { createCorsOptions };
