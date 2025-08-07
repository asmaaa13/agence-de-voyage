/**
 * @fileoverview User model schema and methods
 * @module UserModel
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * User schema definition
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema({
  /**
   * User's first name
   * @type {string}
   * @required
   */
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  /**
   * User's last name
   * @type {string}
   * @required
   */
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  /**
   * User's email address
   * @type {string}
   * @required
   * @unique
   */
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  /**
   * User's hashed password
   * @type {string}
   * @required
   */
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  /**
   * User's phone number
   * @type {string}
   */
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  
  /**
   * User's date of birth
   * @type {Date}
   */
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  
  /**
   * User's role in the system
   * @type {string}
   * @enum {string}
   * @default 'customer'
   */
  role: {
    type: String,
    enum: ['customer', 'agent', 'admin'],
    default: 'customer'
  },
  
  /**
   * User's profile avatar URL
   * @type {string}
   */
  avatar: {
    type: String,
    default: ''
  },
  
  /**
   * Whether the user's email is verified
   * @type {boolean}
   * @default false
   */
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  /**
   * Whether the user account is active
   * @type {boolean}
   * @default true
   */
  isActive: {
    type: Boolean,
    default: true
  },
  
  /**
   * User's preferred language
   * @type {string}
   * @default 'en'
   */
  preferredLanguage: {
    type: String,
    enum: ['en', 'fr', 'es', 'de'],
    default: 'en'
  },
  
  /**
   * Password reset token
   * @type {string}
   */
  resetPasswordToken: String,
  
  /**
   * Password reset token expiration
   * @type {Date}
   */
  resetPasswordExpire: Date,
  
  /**
   * Email verification token
   * @type {string}
   */
  emailVerificationToken: String,
  
  /**
   * User's last login timestamp
   * @type {Date}
   */
  lastLogin: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for user's full name
 * @name fullName
 * @type {string}
 * @readonly
 */
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual field for user's age
 * @name age
 * @type {number}
 * @readonly
 */
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

/**
 * Pre-save middleware to hash password
 * @function
 * @param {Function} next - Next middleware function
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare entered password with hashed password
 * 
 * @method comparePassword
 * @param {string} enteredPassword - The password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * 
 * @example
 * const user = await User.findOne({ email: 'user@example.com' });
 * const isMatch = await user.comparePassword('userPassword123');
 * if (isMatch) {
 *   console.log('Password is correct');
 * }
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token for user authentication
 * 
 * @method generateAuthToken
 * @returns {string} JWT token
 * 
 * @example
 * const user = await User.findById(userId);
 * const token = user.generateAuthToken();
 * res.cookie('token', token, { httpOnly: true });
 */
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET || 'default-secret',
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d' 
    }
  );
};

/**
 * Generate password reset token
 * 
 * @method generatePasswordResetToken
 * @returns {string} Password reset token
 * 
 * @example
 * const user = await User.findOne({ email: 'user@example.com' });
 * const resetToken = user.generatePasswordResetToken();
 * await user.save();
 * // Send resetToken via email
 */
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

/**
 * Generate email verification token
 * 
 * @method generateEmailVerificationToken
 * @returns {string} Email verification token
 * 
 * @example
 * const user = new User({ email: 'new@example.com', password: 'password' });
 * const verificationToken = user.generateEmailVerificationToken();
 * await user.save();
 * // Send verificationToken via email
 */
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  return verificationToken;
};

/**
 * Get public user data (excludes sensitive information)
 * 
 * @method getPublicProfile
 * @returns {Object} Public user profile data
 * 
 * @example
 * const user = await User.findById(userId);
 * const publicProfile = user.getPublicProfile();
 * res.json(publicProfile);
 */
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    preferredLanguage: this.preferredLanguage,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt
  };
};

/**
 * Update user's last login timestamp
 * 
 * @method updateLastLogin
 * @returns {Promise<User>} Updated user document
 * 
 * @example
 * const user = await User.findById(userId);
 * await user.updateLastLogin();
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

/**
 * User model
 * @class User
 * @extends mongoose.Model
 */
const User = mongoose.model('User', userSchema);

export default User;