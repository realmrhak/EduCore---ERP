const errorHandler = (err, req, res, next) => {
  // Log error details server-side (never send to client in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.path}:`, err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(`[Error] ${req.method} ${req.path}: ${err.name || 'Unknown'} - ${err.message}`);
  }

  // ── CORS Error ─────────────────────────────────────────────────────────────
  if (err.message === 'Not allowed by CORS' || err.name === 'CorsError') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: This origin is not allowed to access the API.',
    });
  }

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e) => e.message).join(', '),
    });
  }

  // ── Duplicate Key Error ────────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  // ── Invalid ObjectId ───────────────────────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // ── Database Timeout ───────────────────────────────────────────────────────
  if (err.name === 'MongooseError' && err.message?.includes('timeout')) {
    return res.status(504).json({ success: false, message: 'Database query timeout' });
  }

  // ── Multer File Upload Errors ──────────────────────────────────────────────
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ success: false, message: 'File upload error' });
  }

  // ── Payload Too Large ──────────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request payload too large' });
  }

  // ── Syntax Error (malformed JSON) ──────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
  }

  // ── Generic Server Error ───────────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? (statusCode === 500 ? 'Internal server error' : err.message)
      : err.message,
    // Never include stack trace in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
