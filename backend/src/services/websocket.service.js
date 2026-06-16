const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

let io = null;

// Build allowed origins list from env (same logic as app.js CORS)
const defaultWsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
];

const isVercelOrigin = (origin) => {
  if (!origin) return false;
  return /^https:\/\/[a-z0-9][a-z0-9\-]*(\-[a-z0-9][a-z0-9\-]*)*\.vercel\.app$/i.test(origin);
};

const isRenderOrigin = (origin) => {
  if (!origin) return false;
  return /^https:\/\/[a-z0-9\-]+\.onrender\.com$/i.test(origin);
};

const isLocalDev = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin || '');
};

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultWsOrigins;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Called once from server.js after the server is created.
 */
function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin) || isLocalDev(origin) || isVercelOrigin(origin) || isRenderOrigin(origin)) {
          callback(null, true);
        } else {
          console.warn(`[WS CORS] Rejected origin: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Increase ping timeout for Render cold starts
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for WebSocket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] User connected: ${socket.userId} (${socket.userRole})`);

    // Join a room specific to this user so we can push notifications directly
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    socket.on('disconnect', (reason) => {
      console.log(`[WS] User disconnected: ${socket.userId} (${reason})`);
    });
  });

  console.log('[WS] Socket.IO initialized');
  return io;
}

/**
 * Get the Socket.IO instance (null if not yet initialized).
 */
function getIO() {
  return io;
}

/**
 * Send a real-time notification to a specific user.
 * @param {string} userId - The recipient user ID
 * @param {object} notification - The notification payload
 */
function notifyUser(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

/**
 * Send a real-time notification to all users with a specific role.
 * @param {string} role - The role (student, teacher, etc.)
 * @param {object} notification - The notification payload
 */
function notifyRole(role, notification) {
  if (io) {
    io.to(`role:${role}`).emit('notification', notification);
  }
}

/**
 * Broadcast a notification to all connected clients.
 * @param {object} notification - The notification payload
 */
function notifyAll(notification) {
  if (io) {
    io.emit('notification', notification);
  }
}

module.exports = {
  initWebSocket,
  getIO,
  notifyUser,
  notifyRole,
  notifyAll,
};
