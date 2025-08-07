# API Reference

This document provides detailed information about all available API endpoints in the Agence de Voyage application.

## Table of Contents

- [Authentication](#authentication)
- [Destinations](#destinations)
- [Bookings](#bookings)
- [Users](#users)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Base URL

```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "firstName": "string (required, max 50 chars)",
  "lastName": "string (required, max 50 chars)",
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 6 chars)",
  "phone": "string (optional, valid phone)",
  "dateOfBirth": "date (optional, must be in past)",
  "preferredLanguage": "string (optional, en|fr|es|de)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "customer",
      "isEmailVerified": false,
      "createdAt": "date"
    },
    "token": "string"
  }
}
```

### POST /auth/login

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "lastLogin": "date"
    },
    "token": "string"
  }
}
```

### GET /auth/profile

Get authenticated user's profile.

**Headers:**
- Authorization: Bearer <token>

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "role": "string",
    "preferredLanguage": "string",
    "isEmailVerified": "boolean",
    "createdAt": "date"
  }
}
```

### PUT /auth/profile

Update user profile.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "dateOfBirth": "date (optional)",
  "preferredLanguage": "string (optional)"
}
```

### POST /auth/change-password

Change user password.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

### POST /auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

### POST /auth/reset-password/:token

Reset password using token from email.

**Request Body:**
```json
{
  "newPassword": "string (required, min 6 chars)"
}
```

## Destinations

### GET /destinations

Get list of destinations with filtering and pagination.

**Query Parameters:**
- `category`: string (beach|mountain|city|cultural|adventure|luxury|family|nature)
- `country`: string (filter by country)
- `city`: string (filter by city)
- `search`: string (text search)
- `minPrice`: number (minimum price)
- `maxPrice`: number (maximum price)
- `difficulty`: string (easy|moderate|challenging|extreme)
- `featured`: boolean (featured destinations only)
- `page`: number (page number, default: 1)
- `limit`: number (results per page, default: 20, max: 100)
- `sort`: string (rating|price|name|createdAt)
- `order`: string (asc|desc)

**Response (200):**
```json
{
  "success": true,
  "message": "Destinations retrieved successfully",
  "data": {
    "destinations": [
      {
        "id": "string",
        "name": "string",
        "summary": "string",
        "formattedLocation": "string",
        "featuredImage": "string",
        "category": "string",
        "priceRange": {
          "min": "number",
          "max": "number",
          "currency": "string"
        },
        "rating": "number",
        "reviewCount": "number",
        "duration": "number",
        "difficulty": "string",
        "isFeatured": "boolean"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalResults": "number",
      "hasNext": "boolean",
      "hasPrev": "boolean"
    }
  }
}
```

### GET /destinations/featured

Get featured destinations.

**Query Parameters:**
- `limit`: number (default: 6)

### GET /destinations/search

Search destinations by text.

**Query Parameters:**
- `q`: string (required, search query)
- `category`: string (optional filter)
- `maxPrice`: number (optional filter)
- `limit`: number (default: 20)

### GET /destinations/nearby

Find destinations near coordinates.

**Query Parameters:**
- `lng`: number (required, longitude)
- `lat`: number (required, latitude)
- `radius`: number (optional, meters, default: 100000)
- `limit`: number (optional, default: 10)

### GET /destinations/:id

Get destination details by ID.

**Response (200):**
```json
{
  "success": true,
  "message": "Destination retrieved successfully",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "summary": "string",
    "country": "string",
    "city": "string",
    "location": {
      "coordinates": ["number", "number"],
      "type": "Point"
    },
    "images": ["string"],
    "featuredImage": "string",
    "category": "string",
    "tags": ["string"],
    "priceRange": {
      "min": "number",
      "max": "number",
      "currency": "string"
    },
    "rating": "number",
    "reviewCount": "number",
    "bestTimeToVisit": ["string"],
    "activities": ["string"],
    "duration": "number",
    "difficulty": "string",
    "maxGroupSize": "number",
    "included": ["string"],
    "excluded": ["string"],
    "requirements": ["string"],
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### POST /destinations

Create new destination (Agent/Admin only).

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "name": "string (required, unique)",
  "description": "string (required, max 2000 chars)",
  "summary": "string (required, max 300 chars)",
  "country": "string (required)",
  "city": "string (required)",
  "location": {
    "coordinates": ["number", "number"] // [longitude, latitude]
  },
  "images": ["string"] (optional),
  "featuredImage": "string (optional)",
  "category": "string (required)",
  "tags": ["string"] (optional),
  "priceRange": {
    "min": "number (required)",
    "max": "number (required)",
    "currency": "string (optional, default: EUR)"
  },
  "bestTimeToVisit": ["string"] (optional),
  "activities": ["string"] (optional),
  "duration": "number (optional)",
  "difficulty": "string (optional, default: easy)",
  "maxGroupSize": "number (optional)",
  "included": ["string"] (optional),
  "excluded": ["string"] (optional),
  "requirements": ["string"] (optional)
}
```

### PUT /destinations/:id

Update destination (Agent/Admin only).

**Headers:**
- Authorization: Bearer <token>

### DELETE /destinations/:id

Delete destination (Admin only) - soft delete.

**Headers:**
- Authorization: Bearer <token>

## Bookings

### POST /bookings

Create new booking.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "destination": "string (required, destination ID)",
  "startDate": "date (required, future date)",
  "endDate": "date (required, after start date)",
  "numberOfTravelers": "number (required, 1-20)",
  "travelers": [
    {
      "firstName": "string (required)",
      "lastName": "string (required)",
      "dateOfBirth": "date (required)",
      "passportNumber": "string (optional)",
      "passportExpiry": "date (optional)",
      "nationality": "string (optional)",
      "specialRequirements": "string (optional)"
    }
  ],
  "payment": {
    "method": "string (required, credit_card|debit_card|paypal|bank_transfer|cash)",
    "amount": "number (required, min 0)",
    "currency": "string (optional, default: EUR)"
  },
  "specialRequests": "string (optional, max 1000 chars)",
  "contactPhone": "string (required)",
  "emergencyContact": {
    "name": "string (required)",
    "phone": "string (required)",
    "relationship": "string (required)"
  }
}
```

### GET /bookings/user

Get user's bookings.

**Headers:**
- Authorization: Bearer <token>

**Query Parameters:**
- `status`: string (pending|confirmed|cancelled|completed)
- `limit`: number (default: 20)

### GET /bookings/:id

Get booking details by ID.

**Headers:**
- Authorization: Bearer <token>

### POST /bookings/:id/cancel

Cancel booking.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

### POST /bookings/:id/confirm

Confirm booking (Agent/Admin only).

**Headers:**
- Authorization: Bearer <token>

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "string",
  "data": "object|array"
}
```

### Error Response
```json
{
  "success": false,
  "message": "string",
  "errors": "object (optional, for validation errors)"
}
```

## Error Handling

### HTTP Status Codes

- `200` - OK (successful GET, PUT requests)
- `201` - Created (successful POST requests)
- `400` - Bad Request (validation errors, malformed requests)
- `401` - Unauthorized (authentication required or failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (server error)

### Common Error Messages

#### Authentication Errors
```json
{
  "success": false,
  "message": "Access denied. No valid token provided."
}
```

```json
{
  "success": false,
  "message": "Access denied. Token expired."
}
```

#### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  }
}
```

#### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. Required role(s): agent, admin"
}
```

## Rate Limiting

### Authentication Endpoints
- **Login**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **Registration**: 10 attempts per hour per IP

### General API Endpoints
- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Too many requests. Try again in 10 minutes."
}
```

## Pagination

List endpoints support pagination with these query parameters:

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

### Pagination Response
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalResults": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

### Common Filter Parameters
- Date ranges: `startDate`, `endDate`
- Price ranges: `minPrice`, `maxPrice`
- Text search: `search` (searches name, description, tags)
- Category filtering: `category`
- Status filtering: `status`

### Sorting
- `sort`: Field to sort by
- `order`: Sort direction (`asc` or `desc`)

### Example
```http
GET /api/destinations?category=beach&minPrice=500&maxPrice=2000&sort=rating&order=desc&page=1&limit=10
```