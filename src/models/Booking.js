/**
 * @fileoverview Booking model schema and methods for travel bookings
 * @module BookingModel
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/**
 * Traveler information schema
 * @type {mongoose.Schema}
 */
const travelerSchema = new mongoose.Schema({
  /**
   * Traveler's first name
   * @type {string}
   * @required
   */
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  
  /**
   * Traveler's last name
   * @type {string}
   * @required
   */
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  
  /**
   * Date of birth
   * @type {Date}
   * @required
   */
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  
  /**
   * Passport number
   * @type {string}
   */
  passportNumber: {
    type: String,
    trim: true
  },
  
  /**
   * Passport expiry date
   * @type {Date}
   */
  passportExpiry: Date,
  
  /**
   * Nationality
   * @type {string}
   */
  nationality: {
    type: String,
    trim: true
  },
  
  /**
   * Special requirements or notes
   * @type {string}
   */
  specialRequirements: String
});

/**
 * Payment information schema
 * @type {mongoose.Schema}
 */
const paymentSchema = new mongoose.Schema({
  /**
   * Payment method
   * @type {string}
   * @enum {string}
   * @required
   */
  method: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash']
  },
  
  /**
   * Payment status
   * @type {string}
   * @enum {string}
   * @default 'pending'
   */
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  /**
   * Total amount paid
   * @type {number}
   * @required
   */
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  /**
   * Currency of payment
   * @type {string}
   * @default 'EUR'
   */
  currency: {
    type: String,
    enum: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
    default: 'EUR'
  },
  
  /**
   * External payment transaction ID
   * @type {string}
   */
  transactionId: String,
  
  /**
   * Payment date
   * @type {Date}
   */
  paidAt: Date,
  
  /**
   * Refund amount (if applicable)
   * @type {number}
   * @default 0
   */
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  /**
   * Refund date (if applicable)
   * @type {Date}
   */
  refundedAt: Date
});

/**
 * Booking schema definition
 * @type {mongoose.Schema}
 */
const bookingSchema = new mongoose.Schema({
  /**
   * Unique booking reference number
   * @type {string}
   * @unique
   * @required
   */
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  /**
   * User who made the booking
   * @type {mongoose.ObjectId}
   * @ref User
   * @required
   */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  /**
   * Destination being booked
   * @type {mongoose.ObjectId}
   * @ref Destination
   * @required
   */
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination is required']
  },
  
  /**
   * Travel start date
   * @type {Date}
   * @required
   */
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(date) {
        return date >= new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  
  /**
   * Travel end date
   * @type {Date}
   * @required
   */
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(date) {
        return date > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  /**
   * Number of travelers
   * @type {number}
   * @required
   */
  numberOfTravelers: {
    type: Number,
    required: [true, 'Number of travelers is required'],
    min: [1, 'At least one traveler is required'],
    max: [20, 'Maximum 20 travelers allowed']
  },
  
  /**
   * Detailed traveler information
   * @type {Object[]}
   */
  travelers: [travelerSchema],
  
  /**
   * Booking status
   * @type {string}
   * @enum {string}
   * @default 'pending'
   */
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  
  /**
   * Payment information
   * @type {Object}
   * @required
   */
  payment: {
    type: paymentSchema,
    required: true
  },
  
  /**
   * Special requests or notes
   * @type {string}
   */
  specialRequests: {
    type: String,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters']
  },
  
  /**
   * Contact phone number for the booking
   * @type {string}
   * @required
   */
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  
  /**
   * Emergency contact information
   * @type {Object}
   */
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required']
    }
  },
  
  /**
   * Booking confirmation date
   * @type {Date}
   */
  confirmedAt: Date,
  
  /**
   * Booking cancellation date
   * @type {Date}
   */
  cancelledAt: Date,
  
  /**
   * Cancellation reason
   * @type {string}
   */
  cancellationReason: String,
  
  /**
   * Agent who processed the booking
   * @type {mongoose.ObjectId}
   * @ref User
   */
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  /**
   * Internal notes (visible to agents only)
   * @type {string}
   */
  internalNotes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for trip duration in days
 * @name tripDuration
 * @type {number}
 * @readonly
 */
bookingSchema.virtual('tripDuration').get(function() {
  const timeDiff = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

/**
 * Virtual field for booking total amount
 * @name totalAmount
 * @type {number}
 * @readonly
 */
bookingSchema.virtual('totalAmount').get(function() {
  return this.payment.amount;
});

/**
 * Virtual field for days until trip
 * @name daysUntilTrip
 * @type {number}
 * @readonly
 */
bookingSchema.virtual('daysUntilTrip').get(function() {
  const timeDiff = this.startDate.getTime() - Date.now();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

/**
 * Pre-save middleware to generate booking reference
 * @function
 * @param {Function} next - Next middleware function
 */
bookingSchema.pre('save', async function(next) {
  if (!this.bookingReference) {
    // Generate unique booking reference
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingReference = `BK${timestamp}${random}`;
  }
  next();
});

/**
 * Index for efficient queries
 */
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ destination: 1, startDate: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

/**
 * Find bookings for a specific user
 * 
 * @static
 * @method findByUser
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Booking[]>} Array of user bookings
 * 
 * @example
 * const userBookings = await Booking.findByUser(userId, {
 *   status: 'confirmed',
 *   limit: 10
 * });
 */
bookingSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('destination', 'name city country featuredImage')
    .sort({ startDate: -1 })
    .limit(options.limit || 20);
};

/**
 * Find upcoming bookings
 * 
 * @static
 * @method findUpcoming
 * @param {number} days - Number of days ahead to look
 * @returns {Promise<Booking[]>} Array of upcoming bookings
 * 
 * @example
 * // Find all bookings starting in the next 7 days
 * const upcoming = await Booking.findUpcoming(7);
 */
bookingSchema.statics.findUpcoming = function(days = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    startDate: { $gte: now, $lte: futureDate },
    status: { $in: ['confirmed', 'pending'] }
  })
  .populate('user', 'firstName lastName email phone')
  .populate('destination', 'name city country')
  .sort({ startDate: 1 });
};

/**
 * Generate booking statistics
 * 
 * @static
 * @method getStatistics
 * @param {Date} fromDate - Start date for statistics
 * @param {Date} toDate - End date for statistics
 * @returns {Promise<Object>} Booking statistics
 * 
 * @example
 * const stats = await Booking.getStatistics(
 *   new Date('2024-01-01'),
 *   new Date('2024-12-31')
 * );
 */
bookingSchema.statics.getStatistics = async function(fromDate, toDate) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$payment.amount' }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  return {
    totalBookings: results.reduce((sum, item) => sum + item.count, 0),
    totalRevenue: results.reduce((sum, item) => sum + item.totalRevenue, 0),
    byStatus: results
  };
};

/**
 * Confirm the booking
 * 
 * @method confirm
 * @param {string} agentId - ID of agent confirming the booking
 * @returns {Promise<Booking>} Updated booking
 * 
 * @example
 * const booking = await Booking.findById(bookingId);
 * await booking.confirm(agentId);
 */
bookingSchema.methods.confirm = async function(agentId) {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  if (agentId) {
    this.processedBy = agentId;
  }
  return await this.save();
};

/**
 * Cancel the booking
 * 
 * @method cancel
 * @param {string} reason - Cancellation reason
 * @param {string} agentId - ID of agent processing cancellation
 * @returns {Promise<Booking>} Updated booking
 * 
 * @example
 * const booking = await Booking.findById(bookingId);
 * await booking.cancel('Customer request', agentId);
 */
bookingSchema.methods.cancel = async function(reason, agentId) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  if (agentId) {
    this.processedBy = agentId;
  }
  return await this.save();
};

/**
 * Check if booking can be cancelled
 * 
 * @method canBeCancelled
 * @returns {boolean} True if booking can be cancelled
 * 
 * @example
 * const booking = await Booking.findById(bookingId);
 * if (booking.canBeCancelled()) {
 *   // Show cancel button
 * }
 */
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const daysDiff = (this.startDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
  
  return this.status === 'confirmed' && daysDiff > 1; // Can cancel if more than 1 day before travel
};

/**
 * Get booking summary for notifications/emails
 * 
 * @method getSummary
 * @returns {Object} Booking summary data
 * 
 * @example
 * const booking = await Booking.findById(bookingId).populate('destination user');
 * const summary = booking.getSummary();
 * await sendConfirmationEmail(summary);
 */
bookingSchema.methods.getSummary = function() {
  return {
    bookingReference: this.bookingReference,
    destination: this.destination.name,
    location: `${this.destination.city}, ${this.destination.country}`,
    startDate: this.startDate,
    endDate: this.endDate,
    tripDuration: this.tripDuration,
    numberOfTravelers: this.numberOfTravelers,
    totalAmount: this.payment.amount,
    currency: this.payment.currency,
    status: this.status,
    contactPhone: this.contactPhone
  };
};

/**
 * Booking model
 * @class Booking
 * @extends mongoose.Model
 */
const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;