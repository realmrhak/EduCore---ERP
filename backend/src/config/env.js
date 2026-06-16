// ── Environment Configuration ────────────────────────────────────────────────
// Validates critical env vars and provides sensible defaults for development.
// In production, MONGODB_URI and JWT_SECRET are REQUIRED — the app will NOT start without them.

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (process.env.NODE_ENV === 'production' && missing.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  FATAL: Missing required environment variables in production:');
  missing.forEach((key) => console.error(`    - ${key}`));
  console.error('  Set these in your hosting dashboard (Render, Heroku, etc.)');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

// Development warnings
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET not set — using insecure default. Set it in .env!');
  }
  if (!process.env.MONGODB_URI) {
    console.warn('[WARN] MONGODB_URI not set — using localhost default.');
  }
  if (!process.env.CORS_ORIGIN) {
    console.warn('[WARN] CORS_ORIGIN not set — using localhost defaults.');
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/educore',
  JWT_SECRET: process.env.JWT_SECRET || 'educore_dev_secret_change_in_production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'educore_refresh_dev_secret_change_in_production',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@educore.edu',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  REDIS_URL: process.env.REDIS_URL || '',
  SPLIT_DEPLOYMENT: process.env.SPLIT_DEPLOYMENT || '',  // Set to 'true' for Vercel+Render
};
