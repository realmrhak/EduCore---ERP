const sanitize = require('mongo-sanitize');

// XSS sanitization — strip HTML tags from string values
const xssClean = (obj) => {
  if (typeof obj === 'string') {
    return obj.replace(/<[^>]*>/g, '').trim();
  }
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(xssClean);

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    // Remove keys starting with $ (NoSQL injection)
    if (key.startsWith('$')) continue;
    cleaned[key] = xssClean(obj[key]);
  }
  return cleaned;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
    req.body = xssClean(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  next();
};

module.exports = sanitizeMiddleware;
