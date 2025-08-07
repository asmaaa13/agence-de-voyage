/**
 * @fileoverview Authentication and authorization middleware
 * @module AuthMiddleware
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication middleware to verify JWT tokens
 * 
 * Extracts JWT token from Authorization header, verifies it, and adds user to request object.
 * The token should be sent as: Authorization: Bearer <token>
 * 
 * @function authenticate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Calls next() if authenticated, sends error response if not
 * 
 * @example
 * // Protect a route with authentication
 * router.get('/profile', authenticate, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * 
 * @example
 * // Client request with JWT token
 * fetch('/api/auth/profile', {
 *   headers: {
 *     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *   }
 * });
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    // Find user and check if account is still active
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

/**
 * Authorization middleware factory to check user roles
 * 
 * Creates middleware that checks if authenticated user has required role(s).
 * Must be used after authenticate middleware.
 * 
 * @function authorize
 * @param {string|string[]} roles - Required role(s) for access
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Require admin role
 * router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 * 
 * @example
 * // Allow multiple roles
 * router.post('/destinations', authenticate, authorize(['agent', 'admin']), createDestination);
 * 
 * @example
 * // Role-based access in route definition
 * const agentOnlyRoute = [authenticate, authorize('agent')];
 * router.get('/agent-dashboard', ...agentOnlyRoute, getDashboard);
 */
export function authorize(roles) {
  // Normalize roles to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * 
 * Similar to authenticate but doesn't fail if no token is provided.
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 * 
 * @function optionalAuth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Always calls next(), sets req.user if authenticated
 * 
 * @example
 * // Route that works for both authenticated and anonymous users
 * router.get('/destinations', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Show personalized recommendations
 *     return res.json({ destinations: getPersonalizedDestinations(req.user) });
 *   } else {
 *     // Show general destinations
 *     return res.json({ destinations: getPublicDestinations() });
 *   }
 * });
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    // Find user
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    }

    next();

  } catch (error) {
    // Don't fail on invalid token, just continue without user
    next();
  }
}

/**
 * Middleware to check if user owns a resource or has admin privileges
 * 
 * Checks if the authenticated user owns the resource (user ID matches) 
 * or has admin role. Useful for user profile routes and user-specific data.
 * 
 * @function requireOwnershipOrAdmin
 * @param {string} [userIdParam='id'] - Parameter name containing user ID to check
 * @returns {Function} Express middleware function
 * 
 * @example
 * // User can only access their own bookings or admin can access any
 * router.get('/users/:id/bookings', authenticate, requireOwnershipOrAdmin('id'), getUserBookings);
 * 
 * @example
 * // Default parameter name 'id'
 * router.put('/users/:id', authenticate, requireOwnershipOrAdmin(), updateUser);
 */
export function requireOwnershipOrAdmin(userIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user._id.toString();

    // Allow if user owns the resource or is admin
    if (currentUserId === targetUserId || req.user.role === 'admin') {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
}

/**
 * Rate limiting middleware for authentication endpoints
 * 
 * Implements basic rate limiting for sensitive auth operations like login attempts.
 * Tracks attempts per IP address and blocks excessive requests.
 * 
 * @function authRateLimit
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxAttempts=5] - Maximum attempts per window
 * @param {number} [options.windowMs=900000] - Window size in milliseconds (15 minutes default)
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Limit login attempts
 * router.post('/login', authRateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), login);
 * 
 * @example
 * // Stricter limits for password reset
 * router.post('/forgot-password', authRateLimit({ maxAttempts: 3, windowMs: 60 * 60 * 1000 }), forgotPassword);
 */
export function authRateLimit(options = {}) {
  const { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = options;
  const attempts = new Map(); // In production, use Redis or database

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }

    // Get current attempts for this IP
    const ipAttempts = attempts.get(clientIp) || { count: 0, firstAttempt: now };

    // Check if limit exceeded
    if (ipAttempts.count >= maxAttempts) {
      const remainingTime = Math.ceil((ipAttempts.firstAttempt + windowMs - now) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Try again in ${remainingTime} minutes.`
      });
    }

    // Increment attempt count
    ipAttempts.count++;
    attempts.set(clientIp, ipAttempts);

    next();
  };
}