const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educore';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,  // 15s — Render cold starts can be slow
      socketTimeoutMS: 60000,            // 60s — allow for long queries
      maxPoolSize: 20,                    // Reduced for cloud DB (Atlas free tier)
      minPoolSize: 2,                     // Keep at least 2 connections
      connectTimeoutMS: 15000,            // 15s connection timeout
      heartbeatFrequencyMS: 10000,        // Check connection every 10s
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    setupConnectionHandlers();
    return conn;
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    logger.error('Make sure MONGODB_URI is set correctly in your environment variables.');
    logger.error('For MongoDB Atlas, use: mongodb+srv://<user>:<pass>@cluster.mongodb.net/educore');
    process.exit(1);
  }
};

function setupConnectionHandlers() {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('close', () => {
    logger.info('MongoDB connection closed');
  });
}

// Set global Mongoose query timeout
mongoose.set('maxTimeMS', 30000);

// Suppress strict mode warnings in development
mongoose.set('strictQuery', true);

module.exports = connectDB;
