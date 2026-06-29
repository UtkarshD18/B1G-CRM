const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  app: 'b1gcrm-backend',
  prefix: 'b1gcrm_',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

const httpRequestsTotal = new client.Counter({
  name: 'b1gcrm_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'b1gcrm_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const queueDepthGauge = new client.Gauge({
  name: 'b1gcrm_queue_depth_total',
  help: 'Total jobs in queue',
  labelNames: ['queue_name', 'status']
});

const activeWorkersGauge = new client.Gauge({
  name: 'b1gcrm_active_workers_total',
  help: 'Total active workers processing jobs',
  labelNames: ['worker_type']
});

const websocketConnectionsGauge = new client.Gauge({
  name: 'b1gcrm_websocket_connections_total',
  help: 'Total active websocket connections',
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(queueDepthGauge);
register.registerMetric(activeWorkersGauge);
register.registerMetric(websocketConnectionsGauge);

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationMicroseconds,
  queueDepthGauge,
  activeWorkersGauge,
  websocketConnectionsGauge
};
