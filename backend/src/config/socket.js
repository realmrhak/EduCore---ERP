// backend/src/config/socket.js
const { Server } = require('socket.io');
let io;

function initSocket(server) {
    io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN || '*' } });
    io.on('connection', (socket) => {
        socket.on('join', (userId) => {
            socket.join(userId);
        });
    });
    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

module.exports = { initSocket, getIO };