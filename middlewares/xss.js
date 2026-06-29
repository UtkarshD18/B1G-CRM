const xss = require('xss');

function sanitize(obj) {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = sanitize(obj[key]);
      }
    }
  }
  return obj;
}

function xssMiddleware(req, res, next) {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
}

module.exports = xssMiddleware;
