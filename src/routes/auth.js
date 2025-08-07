/**
 * @fileoverview Authentication routes for user registration, login, and account management
 * @module AuthRoutes
 * @version 1.0.0
 */

import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * @api {post} /api/auth/register Register a new user
 * @apiName RegisterUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Register a new user account with email and password.
 * Creates a new user in the database and returns authentication token.
 * 
 * @apiBody {string} firstName User's first name (required, max 50 chars)
 * @apiBody {string} lastName User's last name (required, max 50 chars)
 * @apiBody {string} email User's email address (required, unique, valid email)
 * @apiBody {string} password User's password (required, min 6 chars)
 * @apiBody {string} [phone] User's phone number (optional, valid format)
 * @apiBody {Date} [dateOfBirth] User's date of birth (optional, must be in past)
 * @apiBody {string} [preferredLanguage="en"] Preferred language (en, fr, es, de)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * @apiSuccess {Object} data Response data
 * @apiSuccess {Object} data.user User information
 * @apiSuccess {string} data.user.id User ID
 * @apiSuccess {string} data.user.firstName User's first name
 * @apiSuccess {string} data.user.lastName User's last name
 * @apiSuccess {string} data.user.email User's email
 * @apiSuccess {string} data.user.role User's role
 * @apiSuccess {string} data.token JWT authentication token
 * 
 * @apiError (400) {boolean} success=false Request failed
 * @apiError (400) {string} message Error message
 * @apiError (400) {Object} errors Validation errors
 * 
 * @apiExample {json} Request Example:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "password": "securePassword123",
 *   "phone": "+33123456789",
 *   "preferredLanguage": "en"
 * }
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": {
 *       "id": "64a7b8c9d123456789012345",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "role": "customer",
 *       "isEmailVerified": false,
 *       "createdAt": "2024-01-15T10:30:00.000Z"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * 
 * @apiExample {json} Error Response:
 * {
 *   "success": false,
 *   "message": "Registration failed",
 *   "errors": {
 *     "email": "Email already exists"
 *   }
 * }
 */
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth, preferredLanguage } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Registration failed',
      errors: { email: 'Email already exists' }
    });
  }

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    preferredLanguage
  });

  await user.save();

  // Generate auth token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
}));

/**
 * @api {post} /api/auth/login Login user
 * @apiName LoginUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Authenticate user with email and password.
 * Returns user information and JWT token for subsequent requests.
 * 
 * @apiBody {string} email User's email address (required)
 * @apiBody {string} password User's password (required)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * @apiSuccess {Object} data Response data
 * @apiSuccess {Object} data.user User information
 * @apiSuccess {string} data.token JWT authentication token
 * 
 * @apiError (401) {boolean} success=false Authentication failed
 * @apiError (401) {string} message Error message
 * 
 * @apiExample {json} Request Example:
 * {
 *   "email": "john.doe@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": {
 *       "id": "64a7b8c9d123456789012345",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "role": "customer",
 *       "lastLogin": "2024-01-15T14:30:00.000Z"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  await user.updateLastLogin();

  // Generate auth token
  const token = user.generateAuthToken();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
}));

/**
 * @api {get} /api/auth/profile Get user profile
 * @apiName GetUserProfile
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get the authenticated user's profile information.
 * Requires valid JWT token in Authorization header.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * @apiSuccess {Object} data User profile data
 * 
 * @apiError (401) {boolean} success=false Authentication required
 * @apiError (401) {string} message Error message
 * 
 * @apiExample {curl} Request Example:
 * curl -X GET http://localhost:3000/api/auth/profile \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Profile retrieved successfully",
 *   "data": {
 *     "id": "64a7b8c9d123456789012345",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "fullName": "John Doe",
 *     "email": "john.doe@example.com",
 *     "phone": "+33123456789",
 *     "role": "customer",
 *     "preferredLanguage": "en",
 *     "isEmailVerified": true,
 *     "createdAt": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: req.user.getPublicProfile()
  });
}));

/**
 * @api {put} /api/auth/profile Update user profile
 * @apiName UpdateUserProfile
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Update the authenticated user's profile information.
 * Only provided fields will be updated.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * 
 * @apiBody {string} [firstName] User's first name
 * @apiBody {string} [lastName] User's last name
 * @apiBody {string} [phone] User's phone number
 * @apiBody {Date} [dateOfBirth] User's date of birth
 * @apiBody {string} [preferredLanguage] Preferred language
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * @apiSuccess {Object} data Updated user profile
 * 
 * @apiExample {json} Request Example:
 * {
 *   "firstName": "John",
 *   "phone": "+33987654321",
 *   "preferredLanguage": "fr"
 * }
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'preferredLanguage'];
  const updates = {};

  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update user
  Object.assign(req.user, updates);
  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: req.user.getPublicProfile()
  });
}));

/**
 * @api {post} /api/auth/change-password Change password
 * @apiName ChangePassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Change the authenticated user's password.
 * Requires current password for verification.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * 
 * @apiBody {string} currentPassword Current password (required)
 * @apiBody {string} newPassword New password (required, min 6 chars)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * 
 * @apiError (400) {boolean} success=false Invalid current password
 * @apiError (400) {string} message Error message
 * 
 * @apiExample {json} Request Example:
 * {
 *   "currentPassword": "oldPassword123",
 *   "newPassword": "newSecurePassword456"
 * }
 */
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

/**
 * @api {post} /api/auth/logout Logout user
 * @apiName LogoutUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Logout the authenticated user.
 * In a stateless JWT implementation, this primarily serves as a client-side action.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a stateless JWT implementation, logout is primarily client-side
  // The client should remove the token from storage
  // In production, you might want to implement token blacklisting
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @api {post} /api/auth/forgot-password Request password reset
 * @apiName ForgotPassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Request a password reset link for the given email.
 * Sends an email with reset instructions if email exists.
 * 
 * @apiBody {string} email User's email address (required)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * 
 * @apiExample {json} Request Example:
 * {
 *   "email": "john.doe@example.com"
 * }
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Password reset email sent if account exists"
 * }
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email });
  
  // Always return success to prevent email enumeration
  if (user) {
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  res.json({
    success: true,
    message: 'Password reset email sent if account exists'
  });
}));

/**
 * @api {post} /api/auth/reset-password/:token Reset password
 * @apiName ResetPassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiDescription Reset password using the token received via email.
 * 
 * @apiParam {string} token Password reset token from email
 * @apiBody {string} newPassword New password (required, min 6 chars)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * 
 * @apiError (400) {boolean} success=false Invalid or expired token
 * @apiError (400) {string} message Error message
 * 
 * @apiExample {json} Request Example:
 * {
 *   "newPassword": "newSecurePassword456"
 * }
 */
router.post('/reset-password/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Update password and clear reset token
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful'
  });
}));

export default router;