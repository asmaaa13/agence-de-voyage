/**
 * @fileoverview Database configuration and connection management
 * @module Database
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/**
 * Database connection options
 * @type {Object}
 * @property {boolean} useNewUrlParser - Use new URL parser
 * @property {boolean} useUnifiedTopology - Use unified topology
 * @property {number} maxPoolSize - Maximum connection pool size
 * @property {number} serverSelectionTimeoutMS - Server selection timeout
 * @property {number} socketTimeoutMS - Socket timeout
 */
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * MongoDB connection string
 * @type {string}
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agence-de-voyage';

/**
 * Connects to MongoDB database
 * 
 * Establishes a connection to the MongoDB database using Mongoose.
 * Includes error handling and connection event listeners.
 * 
 * @async
 * @function connectDatabase
 * @returns {Promise<mongoose.Connection>} The MongoDB connection object
 * @throws {Error} When connection fails
 * 
 * @example
 * // Connect to database
 * try {
 *   const connection = await connectDatabase();
 *   console.log('Database connected successfully');
 * } catch (error) {
 *   console.error('Database connection failed:', error);
 * }
 */
export async function connectDatabase() {
  try {
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Closes the database connection
 * 
 * Gracefully closes the MongoDB connection.
 * 
 * @async
 * @function disconnectDatabase
 * @returns {Promise<void>} Promise that resolves when disconnected
 * 
 * @example
 * // Disconnect from database
 * await disconnectDatabase();
 * console.log('Database disconnected');
 */
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Gets the current database connection status
 * 
 * @function getConnectionStatus
 * @returns {string} Current connection status
 * 
 * @example
 * const status = getConnectionStatus();
 * console.log('Database status:', status);
 */
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
}

export { mongoose };