/**
 * @fileoverview Global error handling middleware for Express application
 * @module ErrorHandler
 * @version 1.0.0
 */

/**
 * Global error handling middleware
 * 
 * Catches all errors that occur in the application and formats them
 * into consistent JSON responses. Handles different types of errors
 * including validation errors, database errors, and JWT errors.
 * 
 * @function errorHandler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Sends error response to client
 * 
 * @example
 * // Register as last middleware in app
 * app.use(errorHandler);
 * 
 * @example
 * // Error will be caught and formatted
 * router.get('/error-test', (req, res, next) => {
 *   throw new Error('Test error');
 * });
 */
export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach(error => {
      errors[error.path] = error.message;
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Not found middleware for undefined routes
 * 
 * Handles requests to routes that don't exist in the application.
 * Should be registered before the error handler middleware.
 * 
 * @function notFoundHandler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Register before error handler
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
}