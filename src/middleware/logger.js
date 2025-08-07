/**
 * @fileoverview Request logging middleware for Express application
 * @module Logger
 * @version 1.0.0
 */

/**
 * Simple request logging middleware
 * 
 * Logs HTTP method, URL, status code, and response time for each request.
 * Useful for monitoring and debugging API usage.
 * 
 * @function logger
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Register as early middleware
 * app.use(logger);
 * 
 * @example
 * // Example log output:
 * // [2024-01-15T14:30:45.123Z] GET /api/destinations 200 - 45ms
 */
export function logger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    // Color code status codes for better visibility
    let statusColor = '';
    if (statusCode >= 200 && statusCode < 300) {
      statusColor = '\x1b[32m'; // Green
    } else if (statusCode >= 300 && statusCode < 400) {
      statusColor = '\x1b[33m'; // Yellow
    } else if (statusCode >= 400 && statusCode < 500) {
      statusColor = '\x1b[31m'; // Red
    } else if (statusCode >= 500) {
      statusColor = '\x1b[35m'; // Magenta
    }
    
    console.log(
      `[${timestamp}] ${method} ${originalUrl} ${statusColor}${statusCode}\x1b[0m - ${duration}ms`
    );
  });
  
  next();
}

/**
 * Enhanced logging middleware with additional request details
 * 
 * Provides more detailed logging including user agent, IP address,
 * and request body size. Useful for production environments.
 * 
 * @function detailedLogger
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Use in production
 * if (process.env.NODE_ENV === 'production') {
 *   app.use(detailedLogger);
 * } else {
 *   app.use(logger);
 * }
 */
export function detailedLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;
    const userAgent = headers['user-agent'] || 'Unknown';
    const contentLength = req.get('content-length') || 0;
    
    console.log(JSON.stringify({
      timestamp,
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      contentLength: `${contentLength}B`
    }));
  });
  
  next();
}