require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const timeout = require('connect-timeout');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const nodeCleanup = require('node-cleanup');
const path = require('path');
const fs = require('fs');

const env = require('./env');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const { errorHandler } = require('./middlewares/errorHandler');
const { runMigrations } = require('./database/migrate');
const { seedDevCredentials } = require('./database/seed-dev');
const setupSwagger = require('./utils/swagger');
const { runCampaign } = require('./loops/campaignLoop.js');
const { init, cleanup } = require('./helper/addon/qr');
const { startKbIndexWorker, stopKbIndexWorker } = require('./workers/kbIndexWorker');

const { httpContextMiddleware, correlationIdMiddleware } = require('./middlewares/observability');
const xssMiddleware = require('./middlewares/xss');

function cleanupAll() {
  try {
    stopKbIndexWorker();
  } catch (err) {
    logger.error('Failed to stop KB Index Worker', { error: err.message });
  }
  cleanup();
}

nodeCleanup(cleanupAll);

const app = express();

// Production Hardening Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Don't break React frontend or WebSockets
  }),
);
app.use(compression());
app.use(timeout('30s')); // Request timeout

app.use(
  express.json({
    limit: env.MAX_FILE_SIZE,
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ limit: env.MAX_FILE_SIZE, extended: true }));

app.use(httpContextMiddleware);
app.use(correlationIdMiddleware);
app.use(xssMiddleware);

// Expose Prometheus Metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Middleware for metrics collection
app.use((req, res, next) => {
  const startEpoch = Date.now();
  res.on('finish', () => {
    const responseTimeInMs = Date.now() - startEpoch;
    // Don't record metrics for the metrics endpoint itself
    if (req.path !== '/metrics') {
      metrics.httpRequestsTotal.inc({
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      });
      metrics.httpRequestDurationMicroseconds.observe(
        {
          method: req.method,
          route: req.route ? req.route.path : req.path,
          status_code: res.statusCode,
        },
        responseTimeInMs / 1000,
      );
    }
  });
  next();
});

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(
  fileUpload({
    limits: { fileSize: env.MAX_FILE_SIZE },
    abortOnLimit: true,
    responseOnLimit: 'File size exceeds the limit',
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const latency = Date.now() - start;
    logger.info(`[ACCESS] ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latencyMs: latency,
    });
  });
  next();
});

app.use(
  '/api/',
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const userRoute = require('./routes/user');
app.use('/api/user', userRoute);

const inboxRouter = require('./routes/inbox');
const qrRouter = require('./routes/qr');
const adminRouter = require('./routes/admin');
const healthRouter = require('./routes/health');

const webRoute = require('./routes/web');
app.use('/api/web', webRoute);

const adminRoute = require('./routes/admin');
app.use('/api/admin', adminRoute);

const phonebookRoute = require('./routes/phonebook');
app.use('/api/phonebook', phonebookRoute);

const chatFlowRoute = require('./routes/chatFlow');
app.use('/api/chat_flow', chatFlowRoute);

const inboxRoute = require('./routes/inbox');
app.use('/api/inbox', inboxRoute);

const templetRoute = require('./routes/templet');
app.use('/api/templet', templetRoute);

const chatbotRoute = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoute);

const chatbotAutomationRoute = require('./routes/chatbotAutomation');
app.use('/api/chatbot-automation', chatbotAutomationRoute);

const broadcastRoute = require('./routes/broadcast');
app.use('/api/broadcast', broadcastRoute);

const apiRoute = require('./routes/apiv2');
app.use('/api/v1', apiRoute);

const webhookRoute = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoute);

const agentRoute = require('./routes/agent');
app.use('/api/agent', agentRoute);

const qrRoute = require('./routes/qr');
app.use('/api/qr', qrRoute);

const instagramRoute = require('./routes/instagram');
app.use('/api/instagram', instagramRoute);

const aiProvidersRoute = require('./routes/ai_providers');
app.use('/api/ai_providers', aiProvidersRoute);

const knowledgeBaseRoute = require('./routes/knowledge_base');
app.use('/api/knowledge_base', knowledgeBaseRoute);

const websiteRoute = require('./routes/website');
app.use('/api/website', websiteRoute);

const crmLeadsRoute = require('./routes/crm_leads');
app.use('/api/crm', crmLeadsRoute);

const agentWorkflowRoute = require('./routes/agent_workflow');
app.use('/api/agent_workflow', agentWorkflowRoute);

const channelsRoute = require('./routes/channels');
app.use('/api/channels', channelsRoute);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    msg: 'Server is healthy',
    timestamp: new Date().toISOString(),
    version: env.appVersion,
    environment: env.NODE_ENV,
  });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'running',
    version: env.appVersion,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const currentDir = process.cwd();
const clientDistDir = path.resolve(currentDir, './client/dist');
const clientPublicDir = path.resolve(currentDir, './client/public');
const publicDir = fs.existsSync(path.join(clientDistDir, 'index.html'))
  ? clientDistDir
  : clientPublicDir;
const indexPath = path.resolve(publicDir, 'index.html');

app.use('/api/v1/inbox', inboxRouter);
app.use('/api/v1/qr', qrRouter);
app.use('/api/v1/admin', adminRouter);

app.use('/', healthRouter);

app.use('/media', express.static(path.join(clientPublicDir, 'media')));
app.use('/static', express.static(path.join(clientPublicDir, 'static')));
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));

// API Documentation
setupSwagger(app);

app.use(express.static(publicDir));

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).json({
    success: false,
    msg: 'Frontend not found. Run: cd client && npm run build',
  });
});

app.use(errorHandler);

const runtime = {
  app,
  server: null,
  io: null,
};

async function startServer() {
  try {
    await runMigrations({ logger });
    if (env.NODE_ENV !== 'production') {
      await seedDevCredentials({ logger });
    }

    runtime.server = app.listen(env.PORT, () => {
      logger.info('B1G CRM server started', {
        port: env.PORT,
        environment: env.NODE_ENV,
        version: env.appVersion,
      });

      try {
        init();
        logger.info('QR handler initialized');
      } catch (err) {
        logger.error('QR initialization failed', { error: err.message });
      }

      setTimeout(() => {
        try {
          runCampaign();
          logger.info('Campaign loop started');
        } catch (err) {
          logger.error('Campaign loop failed', { error: err.message });
        }
        try {
          startKbIndexWorker();
          logger.info('Knowledge Base Indexing worker started');
        } catch (err) {
          logger.error('Knowledge Base Indexing worker failed to start', { error: err.message });
        }
      }, 1000);
    });

    runtime.io = require('./socket').initializeSocket(runtime.server);
  } catch (err) {
    logger.error('Server startup failed', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  if (!runtime.server) {
    cleanupAll();
    process.exit(0);
  }

  runtime.server.close(() => {
    cleanupAll();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

nodeCleanup(cleanupAll);

if (require.main === module) {
  startServer();
}

module.exports = { app, runtime };
