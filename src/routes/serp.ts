import { Router } from 'express';
import * as serpController from '../controllers/serpController';
import { optionalAuth } from '../middleware/auth';

/**
 * SERP API Routes
 * Base path: /api/serp
 *
 * All routes use optional authentication to allow:
 * - Authenticated users: Track usage and preferences
 * - Anonymous users: Still access the service
 */
const router = Router();

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @swagger
 * /api/serp/health:
 *   get:
 *     summary: SERP API health check
 *     tags: [SERP]
 *     description: Check if SERP API is configured and available
 *     responses:
 *       200:
 *         description: SERP API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 configured:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: SERP API is configured and ready
 */
router.get('/health', serpController.getHealthStatus);

/**
 * @swagger
 * /api/serp/restaurants:
 *   get:
 *     summary: Search restaurants
 *     tags: [SERP]
 *     description: Search for restaurants in a destination using SERP API
 *     parameters:
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *           example: Paris
 *         description: City or location name
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *           example: French
 *         description: Cuisine type (e.g., Italian, Japanese)
 *       - in: query
 *         name: priceLevel
 *         schema:
 *           type: string
 *           enum: ['$', '$$', '$$$', '$$$$']
 *           example: $$
 *         description: Price range
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Restaurant search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/restaurants', optionalAuth, serpController.getRestaurants);

/**
 * @swagger
 * /api/serp/attractions:
 *   get:
 *     summary: Search attractions
 *     tags: [SERP]
 *     description: Search for attractions and things to do in a destination
 *     parameters:
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *           example: Paris
 *         description: City or location name
 *       - in: query
 *         name: interests
 *         schema:
 *           type: string
 *           example: culture,art,history
 *         description: Comma-separated interests
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Attraction search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attractions', optionalAuth, serpController.getAttractions);

/**
 * @swagger
 * /api/serp/hotels:
 *   get:
 *     summary: Search hotels
 *     tags: [SERP]
 *     description: Search for hotels in a destination
 *     parameters:
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *           example: Paris
 *         description: City or location name
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-01"
 *         description: Check-in date (YYYY-MM-DD)
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-05"
 *         description: Check-out date (YYYY-MM-DD)
 *       - in: query
 *         name: budget
 *         schema:
 *           type: number
 *           example: 200
 *         description: Maximum budget per night
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Hotel search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/hotels', optionalAuth, serpController.getHotels);

/**
 * GET /api/serp/flights
 * Search for flights between two destinations
 *
 * Query Parameters:
 * - origin (required): Origin city or airport code
 * - destination (required): Destination city or airport code
 * - departureDate (required): Departure date in YYYY-MM-DD format
 * - returnDate (optional): Return date in YYYY-MM-DD format (for round trips)
 * - adults (optional): Number of adult passengers (default: 1)
 * - children (optional): Number of child passengers (default: 0)
 * - cabinClass (optional): Cabin class (economy, premium_economy, business, first)
 * - limit (optional): Maximum number of results (default: 10)
 *
 * Example: /api/serp/flights?origin=NYC&destination=Paris&departureDate=2025-12-01&returnDate=2025-12-05&adults=2&cabinClass=economy
 */
router.get('/flights', optionalAuth, serpController.getFlights);

/**
 * GET /api/serp/flight-booking-options
 * Get booking options for a specific flight using booking_token
 *
 * Query Parameters:
 * - bookingToken (required): Booking token from flight search results
 *
 * Example: /api/serp/flight-booking-options?bookingToken=ABC123...
 */
router.get('/flight-booking-options', optionalAuth, serpController.getFlightBookingOptions);

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
