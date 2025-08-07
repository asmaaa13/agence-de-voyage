/**
 * @fileoverview Destination model schema and methods for travel destinations
 * @module DestinationModel
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/**
 * Location schema for geographical coordinates
 * @type {mongoose.Schema}
 */
const locationSchema = new mongoose.Schema({
  /**
   * Geographic coordinates
   * @type {Object}
   */
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && // longitude
               coords[1] >= -90 && coords[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] within valid ranges'
    }
  },
  /**
   * GeoJSON type
   * @type {string}
   * @default 'Point'
   */
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  }
});

/**
 * Price range schema
 * @type {mongoose.Schema}
 */
const priceRangeSchema = new mongoose.Schema({
  /**
   * Minimum price
   * @type {number}
   */
  min: {
    type: Number,
    required: true,
    min: 0
  },
  /**
   * Maximum price
   * @type {number}
   */
  max: {
    type: Number,
    required: true,
    min: 0
  },
  /**
   * Currency code
   * @type {string}
   * @default 'EUR'
   */
  currency: {
    type: String,
    enum: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
    default: 'EUR'
  }
});

/**
 * Destination schema definition
 * @type {mongoose.Schema}
 */
const destinationSchema = new mongoose.Schema({
  /**
   * Destination name
   * @type {string}
   * @required
   * @unique
   */
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Destination name cannot exceed 100 characters']
  },
  
  /**
   * Destination description
   * @type {string}
   * @required
   */
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  /**
   * Short summary for listings
   * @type {string}
   * @required
   */
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [300, 'Summary cannot exceed 300 characters']
  },
  
  /**
   * Country where destination is located
   * @type {string}
   * @required
   */
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  
  /**
   * City or region
   * @type {string}
   * @required
   */
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  
  /**
   * Geographic location
   * @type {Object}
   */
  location: {
    type: locationSchema,
    required: true
  },
  
  /**
   * Array of destination images
   * @type {string[]}
   */
  images: [{
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(url);
      },
      message: 'Invalid image URL format'
    }
  }],
  
  /**
   * Main featured image
   * @type {string}
   */
  featuredImage: {
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(url);
      },
      message: 'Invalid image URL format'
    }
  },
  
  /**
   * Destination category
   * @type {string}
   * @enum {string}
   * @required
   */
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['beach', 'mountain', 'city', 'cultural', 'adventure', 'luxury', 'family', 'nature']
  },
  
  /**
   * Destination tags for filtering
   * @type {string[]}
   */
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  /**
   * Price range for this destination
   * @type {Object}
   */
  priceRange: {
    type: priceRangeSchema,
    required: true
  },
  
  /**
   * Average rating from reviews
   * @type {number}
   * @default 0
   */
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  /**
   * Number of reviews
   * @type {number}
   * @default 0
   */
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  /**
   * Best time to visit
   * @type {string[]}
   */
  bestTimeToVisit: [{
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  }],
  
  /**
   * Activities available at destination
   * @type {string[]}
   */
  activities: [{
    type: String,
    trim: true
  }],
  
  /**
   * Duration of typical visit (in days)
   * @type {number}
   */
  duration: {
    type: Number,
    min: 1,
    max: 30
  },
  
  /**
   * Difficulty level
   * @type {string}
   * @enum {string}
   * @default 'easy'
   */
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'extreme'],
    default: 'easy'
  },
  
  /**
   * Whether destination is currently available for booking
   * @type {boolean}
   * @default true
   */
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  /**
   * Whether destination is featured/promoted
   * @type {boolean}
   * @default false
   */
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  /**
   * Maximum group size
   * @type {number}
   */
  maxGroupSize: {
    type: Number,
    min: 1,
    max: 50
  },
  
  /**
   * Included services
   * @type {string[]}
   */
  included: [{
    type: String,
    trim: true
  }],
  
  /**
   * Excluded services
   * @type {string[]}
   */
  excluded: [{
    type: String,
    trim: true
  }],
  
  /**
   * Important notes or requirements
   * @type {string[]}
   */
  requirements: [{
    type: String,
    trim: true
  }],
  
  /**
   * User who created this destination (agent/admin)
   * @type {mongoose.ObjectId}
   * @ref User
   */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Create geospatial index for location-based queries
 */
destinationSchema.index({ location: '2dsphere' });

/**
 * Create text index for search functionality
 */
destinationSchema.index({ 
  name: 'text', 
  description: 'text', 
  summary: 'text',
  country: 'text',
  city: 'text',
  tags: 'text'
});

/**
 * Create compound index for filtering
 */
destinationSchema.index({ category: 1, isAvailable: 1, isFeatured: -1 });

/**
 * Virtual field for formatted location
 * @name formattedLocation
 * @type {string}
 * @readonly
 */
destinationSchema.virtual('formattedLocation').get(function() {
  return `${this.city}, ${this.country}`;
});

/**
 * Virtual field for popularity score
 * @name popularityScore
 * @type {number}
 * @readonly
 */
destinationSchema.virtual('popularityScore').get(function() {
  return (this.rating * this.reviewCount) / 10;
});

/**
 * Find destinations near a specific location
 * 
 * @static
 * @method findNearby
 * @param {number[]} coordinates - [longitude, latitude]
 * @param {number} maxDistance - Maximum distance in meters
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Destination[]>} Array of nearby destinations
 * 
 * @example
 * // Find destinations within 100km of Paris
 * const nearby = await Destination.findNearby([2.3522, 48.8566], 100000, 10);
 * console.log(`Found ${nearby.length} destinations near Paris`);
 */
destinationSchema.statics.findNearby = function(coordinates, maxDistance = 100000, limit = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    isAvailable: true
  }).limit(limit);
};

/**
 * Find featured destinations
 * 
 * @static
 * @method findFeatured
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Destination[]>} Array of featured destinations
 * 
 * @example
 * const featured = await Destination.findFeatured(5);
 * console.log('Featured destinations:', featured);
 */
destinationSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    isAvailable: true 
  })
  .sort({ rating: -1, reviewCount: -1 })
  .limit(limit);
};

/**
 * Search destinations by text
 * 
 * @static
 * @method searchByText
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @returns {Promise<Destination[]>} Array of matching destinations
 * 
 * @example
 * const results = await Destination.searchByText('beach paradise', {
 *   category: 'beach',
 *   limit: 20
 * });
 */
destinationSchema.statics.searchByText = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    isAvailable: true
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.maxPrice) {
    query['priceRange.max'] = { $lte: options.maxPrice };
  }
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' }, rating: -1 })
    .limit(options.limit || 20);
};

/**
 * Update destination rating
 * 
 * @method updateRating
 * @param {number} newRating - New rating value (1-5)
 * @returns {Promise<Destination>} Updated destination
 * 
 * @example
 * const destination = await Destination.findById(destId);
 * await destination.updateRating(4.5);
 */
destinationSchema.methods.updateRating = async function(newRating) {
  // This would typically be called when a new review is added
  // In a real application, you'd calculate this from actual review data
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  
  return await this.save();
};

/**
 * Check if destination is available for given dates
 * 
 * @method isAvailableForDates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} True if available
 * 
 * @example
 * const destination = await Destination.findById(destId);
 * const available = destination.isAvailableForDates(
 *   new Date('2024-06-01'),
 *   new Date('2024-06-07')
 * );
 */
destinationSchema.methods.isAvailableForDates = function(startDate, endDate) {
  // Basic availability check - in real app, this would check bookings
  return this.isAvailable && startDate >= new Date();
};

/**
 * Get destination summary for listings
 * 
 * @method getSummary
 * @returns {Object} Destination summary data
 * 
 * @example
 * const destination = await Destination.findById(destId);
 * const summary = destination.getSummary();
 * res.json(summary);
 */
destinationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    summary: this.summary,
    formattedLocation: this.formattedLocation,
    featuredImage: this.featuredImage,
    category: this.category,
    priceRange: this.priceRange,
    rating: this.rating,
    reviewCount: this.reviewCount,
    duration: this.duration,
    difficulty: this.difficulty,
    isFeatured: this.isFeatured
  };
};

/**
 * Destination model
 * @class Destination
 * @extends mongoose.Model
 */
const Destination = mongoose.model('Destination', destinationSchema);

export default Destination;