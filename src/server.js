/**
 * @fileoverview Main server file for the Agence de Voyage application
 * @module Server
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import destinationRoutes from './routes/destinations.js';
import userRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

dotenv.config();

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Server port number
 * @type {number}
 * @default 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * Initializes and configures the Express server
 * 
 * This function sets up middleware, routes, and database connection.
 * It handles CORS, JSON parsing, logging, and error handling.
 * 
 * @async
 * @function initializeServer
 * @returns {Promise<void>} Promise that resolves when server is initialized
 * 
 * @example
 * // Initialize the server
 * await initializeServer();
 * console.log('Server running on port 3000');
 */
async function initializeServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Middleware setup
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(logger);
    
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/destinations', destinationRoutes);
    app.use('/api/users', userRoutes);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to Agence de Voyage API',
        version: '1.0.0',
        documentation: '/api/docs'
      });
    });
    
    // Error handling middleware
    app.use(errorHandler);
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

/**
 * Starts the HTTP server
 * 
 * @function startServer
 * @returns {Promise<void>} Promise that resolves when server starts listening
 * 
 * @example
 * // Start the server
 * startServer().then(() => {
 *   console.log('Server is running');
 * });
 */
function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, (error) => {
      if (error) {
        reject(error);
      } else {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        resolve();
      }
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  });
}

// Initialize and start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeServer().then(startServer).catch(console.error);
}

export { app, initializeServer, startServer };