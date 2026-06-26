const { v4: uuidv4 } = require('uuid');
const httpContext = require('express-http-context');

function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  httpContext.set('correlation_id', correlationId);
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

module.exports = {
  httpContextMiddleware: httpContext.middleware,
  correlationIdMiddleware
};
