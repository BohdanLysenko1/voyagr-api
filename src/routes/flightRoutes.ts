import { Router } from 'express';
import {
  searchFlights,
  confirmFlightPrice,
  bookFlight,
  getBooking,
} from '../controllers/flightController';
import { optionalAuth, authenticateUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/flights/search:
 *   get:
 *     summary: Search for flights
 *     tags: [Flights]
 *     description: Search for available flights using Amadeus API
 *     parameters:
 *       - in: query
 *         name: originLocationCode
 *         required: true
 *         schema:
 *           type: string
 *           example: JFK
 *         description: IATA airport code for origin
 *       - in: query
 *         name: destinationLocationCode
 *         required: true
 *         schema:
 *           type: string
 *           example: CDG
 *         description: IATA airport code for destination
 *       - in: query
 *         name: departureDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-01"
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: returnDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-05"
 *         description: Return date for round trip (YYYY-MM-DD)
 *       - in: query
 *         name: adults
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         description: Number of adult passengers
 *       - in: query
 *         name: children
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *         description: Number of child passengers
 *       - in: query
 *         name: infants
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *         description: Number of infant passengers
 *       - in: query
 *         name: travelClass
 *         schema:
 *           type: string
 *           enum: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST]
 *           example: ECONOMY
 *         description: Travel class
 *       - in: query
 *         name: max
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Maximum number of flight offers
 *     responses:
 *       200:
 *         description: Flight search results
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
router.get('/search', optionalAuth, asyncHandler(searchFlights));

/**
 * @swagger
 * /api/flights/price:
 *   post:
 *     summary: Confirm flight pricing
 *     tags: [Flights]
 *     description: Confirm and validate flight pricing before booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flightOffers
 *             properties:
 *               flightOffers:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of flight offers to price
 *     responses:
 *       200:
 *         description: Pricing confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
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
router.post('/price', optionalAuth, asyncHandler(confirmFlightPrice));

/**
 * @swagger
 * /api/flights/book:
 *   post:
 *     summary: Book a flight
 *     tags: [Flights]
 *     description: Book a flight with passenger information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flightOffers
 *               - travelers
 *             properties:
 *               flightOffers:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Selected flight offers
 *               travelers:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Passenger information
 *     responses:
 *       200:
 *         description: Flight booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       example: BOOK123
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
router.post('/book', authenticateUser, asyncHandler(bookFlight));

/**
 * @swagger
 * /api/flights/bookings/{bookingId}:
 *   get:
 *     summary: Get booking details
 *     tags: [Flights]
 *     description: Retrieve flight booking information
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           example: BOOK123
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
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
router.get('/bookings/:bookingId', authenticateUser, asyncHandler(getBooking));

export default router;
