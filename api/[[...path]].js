// ──────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function — API Proxy
// ──────────────────────────────────────────────────────────────────────────────
// This file enables running the backend as a Vercel serverless function.
// It is ONLY needed if you deploy both frontend AND backend to Vercel.
//
// For the recommended SPLIT DEPLOYMENT (Vercel frontend + Render backend):
// - This file is NOT used
// - Set VITE_API_URL in Vercel to point to your Render backend
// - Remove or ignore this file
//
// For a monorepo Vercel deployment:
// - This file handles API requests via serverless functions
// - Requires MONGODB_URI, JWT_SECRET, etc. in Vercel environment variables
// - Note: Serverless functions have cold start latency and limited execution time
// ──────────────────────────────────────────────────────────────────────────────

const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/database');

let dbConnected = false;

module.exports = async (req, res) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      return res.status(503).json({ success: false, message: 'Database connection failed' });
    }
  }

  return app(req, res);
};
