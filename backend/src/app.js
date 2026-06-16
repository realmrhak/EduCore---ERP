const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const sanitizeMiddleware = require('./middleware/sanitize.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter, authLimiter, forgotPasswordLimiter } = require('./middleware/rateLimiter.middleware');
const routes = require('./routes');

const app = express();

// Trust the first proxy (Render, Heroku, etc.) so req.ip reflects the real client IP
// This is required for rate limiting to work correctly behind a reverse proxy.
app.set('trust proxy', 1);

// ── CORS Configuration ──────────────────────────────────────────────────────
// Allows the deployed frontend (Vercel) to communicate with the backend (Render).
// Set CORS_ORIGIN env var to a comma-separated list of allowed origins, e.g.:
//   CORS_ORIGIN=https://edu-core-erp.vercel.app,https://educore-erp.vercel.app

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
];

// Regex: match any Vercel deployment URL (including preview deployments)
const isVercelOrigin = (origin) => {
  if (!origin) return false;
  // Matches https://anything.vercel.app and https://anything-git-branch-anything.vercel.app
  return /^https:\/\/[a-z0-9][a-z0-9\-]*(\-[a-z0-9][a-z0-9\-]*)*\.vercel\.app$/i.test(origin);
};

// Regex: match any Render deployment URL
const isRenderOrigin = (origin) => {
  if (!origin) return false;
  return /^https:\/\/[a-z0-9\-]+\.onrender\.com$/i.test(origin);
};

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultCorsOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server, Postman)
    if (!origin) return callback(null, true);

    const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);

    if (corsOrigins.includes(origin) || isLocalDevOrigin || isVercelOrigin(origin) || isRenderOrigin(origin)) {
      callback(null, true);
      return;
    }

    // Log rejected origins for debugging (but don't crash)
    console.warn(`[CORS] Rejected origin: ${origin}`);
    callback(null, false); // Don't throw — just reject the request
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

// ── Security Headers ────────────────────────────────────────────────────────
// Helmet configuration adapted for split deployment (frontend on Vercel, backend on Render)
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
      // Allow connections to self (for same-origin requests) and Cloudinary
      // The frontend handles its own CSP; backend CSP mainly affects server-rendered content
      connectSrc: ["'self'", 'https://res.cloudinary.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'res.cloudinary.com'],
      frameSrc: ["'none'"],
    },
  } : false, // Disable CSP in development for easier debugging
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Needed for cross-origin resource loading
  crossOriginOpenerPolicy: false,   // Needed for cross-origin scenarios
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// ── Gzip Compression ────────────────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sanitization (NoSQL injection + XSS) ────────────────────────────────────
app.use(sanitizeMiddleware);

// ── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health Check Endpoint (no auth required) ────────────────────────────────
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Static File Serving ─────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true,
}));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// Global 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ── Production: Serve Frontend Static Files ─────────────────────────────────
// Only when NOT using split deployment (Vercel+Render). This serves the frontend
// from the backend when deploying as a single server (e.g., VPS with PM2).
if (process.env.NODE_ENV === 'production' && !process.env.SPLIT_DEPLOYMENT) {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath, {
    maxAge: '1y',
    etag: true,
    immutable: true,
  }));
  // SPA routing — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// ── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
