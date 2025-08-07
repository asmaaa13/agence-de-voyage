/**
 * @fileoverview Destination routes for browsing and managing travel destinations
 * @module DestinationRoutes
 * @version 1.0.0
 */

import express from 'express';
import Destination from '../models/Destination.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateDestination } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * @api {get} /api/destinations Get all destinations
 * @apiName GetDestinations
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieve a list of available destinations with filtering and pagination.
 * 
 * @apiQuery {string} [category] Filter by category (beach, mountain, city, cultural, adventure, luxury, family, nature)
 * @apiQuery {string} [country] Filter by country
 * @apiQuery {string} [city] Filter by city
 * @apiQuery {string} [search] Text search in name, description, and tags
 * @apiQuery {number} [minPrice] Minimum price filter
 * @apiQuery {number} [maxPrice] Maximum price filter
 * @apiQuery {string} [difficulty] Filter by difficulty (easy, moderate, challenging, extreme)
 * @apiQuery {boolean} [featured] Show only featured destinations
 * @apiQuery {number} [page=1] Page number for pagination
 * @apiQuery {number} [limit=20] Number of results per page
 * @apiQuery {string} [sort="rating"] Sort by (rating, price, name, createdAt)
 * @apiQuery {string} [order="desc"] Sort order (asc, desc)
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * @apiSuccess {Object} data Response data
 * @apiSuccess {Object[]} data.destinations Array of destination objects
 * @apiSuccess {Object} data.pagination Pagination information
 * @apiSuccess {number} data.pagination.currentPage Current page number
 * @apiSuccess {number} data.pagination.totalPages Total number of pages
 * @apiSuccess {number} data.pagination.totalResults Total number of results
 * @apiSuccess {number} data.pagination.hasNext Whether there's a next page
 * @apiSuccess {number} data.pagination.hasPrev Whether there's a previous page
 * 
 * @apiExample {curl} Request Example:
 * curl "http://localhost:3000/api/destinations?category=beach&maxPrice=2000&page=1&limit=10"
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Destinations retrieved successfully",
 *   "data": {
 *     "destinations": [
 *       {
 *         "id": "64a7b8c9d123456789012345",
 *         "name": "Maldives Paradise Resort",
 *         "summary": "Luxurious overwater bungalows in crystal clear waters",
 *         "formattedLocation": "Malé, Maldives",
 *         "featuredImage": "https://example.com/maldives.jpg",
 *         "category": "beach",
 *         "priceRange": { "min": 800, "max": 1500, "currency": "EUR" },
 *         "rating": 4.8,
 *         "reviewCount": 127,
 *         "duration": 7,
 *         "difficulty": "easy",
 *         "isFeatured": true
 *       }
 *     ],
 *     "pagination": {
 *       "currentPage": 1,
 *       "totalPages": 5,
 *       "totalResults": 47,
 *       "hasNext": true,
 *       "hasPrev": false
 *     }
 *   }
 * }
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    category,
    country,
    city,
    search,
    minPrice,
    maxPrice,
    difficulty,
    featured,
    page = 1,
    limit = 20,
    sort = 'rating',
    order = 'desc'
  } = req.query;

  // Build query
  const query = { isAvailable: true };

  if (category) query.category = category;
  if (country) query.country = new RegExp(country, 'i');
  if (city) query.city = new RegExp(city, 'i');
  if (difficulty) query.difficulty = difficulty;
  if (featured === 'true') query.isFeatured = true;

  // Price range filtering
  if (minPrice || maxPrice) {
    query['priceRange.min'] = {};
    query['priceRange.max'] = {};
    
    if (minPrice) {
      query['priceRange.min'].$gte = parseInt(minPrice);
    }
    if (maxPrice) {
      query['priceRange.max'].$lte = parseInt(maxPrice);
    }
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortObj = {};
  sortObj[sort] = order === 'asc' ? 1 : -1;

  // Execute query
  const [destinations, totalCount] = await Promise.all([
    Destination.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-createdBy -__v'),
    Destination.countDocuments(query)
  ]);

  // Format response
  const formattedDestinations = destinations.map(dest => dest.getSummary());

  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    success: true,
    message: 'Destinations retrieved successfully',
    data: {
      destinations: formattedDestinations,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalResults: totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }
  });
}));

/**
 * @api {get} /api/destinations/featured Get featured destinations
 * @apiName GetFeaturedDestinations
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get a list of featured destinations for homepage or promotional use.
 * 
 * @apiQuery {number} [limit=6] Number of featured destinations to return
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {Object[]} data Array of featured destination objects
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Featured destinations retrieved successfully",
 *   "data": [
 *     {
 *       "id": "64a7b8c9d123456789012345",
 *       "name": "Santorini Sunset Villa",
 *       "summary": "Breathtaking sunset views over the Aegean Sea",
 *       "formattedLocation": "Santorini, Greece",
 *       "featuredImage": "https://example.com/santorini.jpg",
 *       "category": "luxury",
 *       "rating": 4.9,
 *       "isFeatured": true
 *     }
 *   ]
 * }
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  const destinations = await Destination.findFeatured(limit);
  const formattedDestinations = destinations.map(dest => dest.getSummary());

  res.json({
    success: true,
    message: 'Featured destinations retrieved successfully',
    data: formattedDestinations
  });
}));

/**
 * @api {get} /api/destinations/search Search destinations
 * @apiName SearchDestinations
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * 
 * @apiDescription Advanced text search across destination names, descriptions, and tags.
 * 
 * @apiQuery {string} q Search query string (required)
 * @apiQuery {string} [category] Filter by category
 * @apiQuery {number} [maxPrice] Maximum price filter
 * @apiQuery {number} [limit=20] Number of results to return
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {Object[]} data Array of matching destination objects
 * 
 * @apiExample {curl} Request Example:
 * curl "http://localhost:3000/api/destinations/search?q=tropical%20beach&category=beach&limit=10"
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, category, maxPrice, limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const options = {
    category,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    limit: parseInt(limit)
  };

  const destinations = await Destination.searchByText(q, options);
  const formattedDestinations = destinations.map(dest => dest.getSummary());

  res.json({
    success: true,
    message: 'Search results retrieved successfully',
    data: formattedDestinations
  });
}));

/**
 * @api {get} /api/destinations/nearby Find nearby destinations
 * @apiName GetNearbyDestinations
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * 
 * @apiDescription Find destinations near a specific location using coordinates.
 * 
 * @apiQuery {number} lng Longitude coordinate (required)
 * @apiQuery {number} lat Latitude coordinate (required)
 * @apiQuery {number} [radius=100000] Search radius in meters (default 100km)
 * @apiQuery {number} [limit=10] Number of results to return
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {Object[]} data Array of nearby destination objects
 * 
 * @apiExample {curl} Request Example:
 * curl "http://localhost:3000/api/destinations/nearby?lng=2.3522&lat=48.8566&radius=50000&limit=5"
 */
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lng, lat, radius = 100000, limit = 10 } = req.query;

  if (!lng || !lat) {
    return res.status(400).json({
      success: false,
      message: 'Longitude and latitude coordinates are required'
    });
  }

  const coordinates = [parseFloat(lng), parseFloat(lat)];
  const destinations = await Destination.findNearby(
    coordinates,
    parseInt(radius),
    parseInt(limit)
  );

  const formattedDestinations = destinations.map(dest => dest.getSummary());

  res.json({
    success: true,
    message: 'Nearby destinations retrieved successfully',
    data: formattedDestinations
  });
}));

/**
 * @api {get} /api/destinations/:id Get destination details
 * @apiName GetDestinationById
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get detailed information about a specific destination.
 * 
 * @apiParam {string} id Destination ID
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {Object} data Detailed destination object
 * 
 * @apiError (404) {boolean} success=false Destination not found
 * 
 * @apiExample {json} Success Response:
 * {
 *   "success": true,
 *   "message": "Destination retrieved successfully",
 *   "data": {
 *     "id": "64a7b8c9d123456789012345",
 *     "name": "Bali Adventure Package",
 *     "description": "Complete description of the destination...",
 *     "summary": "Short summary...",
 *     "country": "Indonesia",
 *     "city": "Ubud",
 *     "location": {
 *       "coordinates": [115.2191, -8.5069],
 *       "type": "Point"
 *     },
 *     "images": ["url1.jpg", "url2.jpg"],
 *     "featuredImage": "featured.jpg",
 *     "category": "adventure",
 *     "tags": ["temple", "culture", "nature"],
 *     "priceRange": { "min": 600, "max": 1200, "currency": "EUR" },
 *     "rating": 4.7,
 *     "reviewCount": 89,
 *     "bestTimeToVisit": ["April", "May", "September", "October"],
 *     "activities": ["Temple tours", "Rice terrace hiking", "Cooking classes"],
 *     "duration": 5,
 *     "difficulty": "moderate",
 *     "maxGroupSize": 12,
 *     "included": ["Accommodation", "Breakfast", "Guide"],
 *     "excluded": ["Flights", "Lunch", "Dinner"],
 *     "requirements": ["Valid passport", "Travel insurance"]
 *   }
 * }
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id)
    .populate('createdBy', 'firstName lastName role');

  if (!destination || !destination.isAvailable) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found'
    });
  }

  res.json({
    success: true,
    message: 'Destination retrieved successfully',
    data: destination
  });
}));

/**
 * @api {post} /api/destinations Create new destination
 * @apiName CreateDestination
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * @apiPermission agent, admin
 * 
 * @apiDescription Create a new destination. Requires agent or admin privileges.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * 
 * @apiBody {string} name Destination name (required, unique)
 * @apiBody {string} description Detailed description (required)
 * @apiBody {string} summary Short summary (required)
 * @apiBody {string} country Country name (required)
 * @apiBody {string} city City name (required)
 * @apiBody {Object} location Geographic location with coordinates
 * @apiBody {number[]} location.coordinates [longitude, latitude]
 * @apiBody {string[]} [images] Array of image URLs
 * @apiBody {string} [featuredImage] Main image URL
 * @apiBody {string} category Destination category (required)
 * @apiBody {string[]} [tags] Array of tags
 * @apiBody {Object} priceRange Price range object (required)
 * @apiBody {number} priceRange.min Minimum price
 * @apiBody {number} priceRange.max Maximum price
 * @apiBody {string} [priceRange.currency] Currency code
 * 
 * @apiSuccess (201) {boolean} success Request success status
 * @apiSuccess (201) {Object} data Created destination object
 * 
 * @apiError (403) {boolean} success=false Insufficient permissions
 * @apiError (400) {boolean} success=false Validation errors
 */
router.post('/', authenticate, authorize(['agent', 'admin']), validateDestination, asyncHandler(async (req, res) => {
  const destinationData = {
    ...req.body,
    createdBy: req.user._id
  };

  const destination = new Destination(destinationData);
  await destination.save();

  res.status(201).json({
    success: true,
    message: 'Destination created successfully',
    data: destination
  });
}));

/**
 * @api {put} /api/destinations/:id Update destination
 * @apiName UpdateDestination
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * @apiPermission agent, admin
 * 
 * @apiDescription Update an existing destination. Requires agent or admin privileges.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * @apiParam {string} id Destination ID
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {Object} data Updated destination object
 * 
 * @apiError (404) {boolean} success=false Destination not found
 * @apiError (403) {boolean} success=false Insufficient permissions
 */
router.put('/:id', authenticate, authorize(['agent', 'admin']), asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);

  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found'
    });
  }

  // Update fields
  Object.assign(destination, req.body);
  await destination.save();

  res.json({
    success: true,
    message: 'Destination updated successfully',
    data: destination
  });
}));

/**
 * @api {delete} /api/destinations/:id Delete destination
 * @apiName DeleteDestination
 * @apiGroup Destinations
 * @apiVersion 1.0.0
 * @apiPermission admin
 * 
 * @apiDescription Delete a destination. Requires admin privileges.
 * This will set isAvailable to false instead of permanently deleting.
 * 
 * @apiHeader {string} Authorization Bearer JWT token
 * @apiParam {string} id Destination ID
 * 
 * @apiSuccess {boolean} success Request success status
 * @apiSuccess {string} message Success message
 * 
 * @apiError (404) {boolean} success=false Destination not found
 * @apiError (403) {boolean} success=false Insufficient permissions
 */
router.delete('/:id', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);

  if (!destination) {
    return res.status(404).json({
      success: false,
      message: 'Destination not found'
    });
  }

  // Soft delete by setting isAvailable to false
  destination.isAvailable = false;
  await destination.save();

  res.json({
    success: true,
    message: 'Destination deleted successfully'
  });
}));

export default router;