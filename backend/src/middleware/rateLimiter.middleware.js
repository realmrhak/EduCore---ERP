const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Login rate limiter: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev && req.ip === '127.0.0.1',
  // For Render/Heroku proxy support, trustProxy must be set on the Express app,
  // not on the rate limiter. See server.js where app.set('trust proxy', 1) is called.
});

// Forgot password rate limiter: 5 per hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global API rate limiter: 500 per 15 minutes in dev, 200 in production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, forgotPasswordLimiter, apiLimiter };
