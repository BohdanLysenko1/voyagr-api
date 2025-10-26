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
 * @route   GET /flights/search
 * @desc    Search for available flights
 * @access  Public
 * @query   originLocationCode, destinationLocationCode, departureDate, returnDate (optional),
 *          adults, children (optional), infants (optional), travelClass (optional), max (optional)
 */
router.get('/search', optionalAuth, asyncHandler(searchFlights));

/**
 * @route   POST /flights/price
 * @desc    Confirm flight pricing before booking
 * @access  Public
 * @body    { flightOffers: FlightOffer[] }
 */
router.post('/price', optionalAuth, asyncHandler(confirmFlightPrice));

/**
 * @route   POST /flights/book
 * @desc    Book a flight
 * @access  Private (requires authentication)
 * @body    {
 *            flightOffers: FlightOffer[],
 *            travelers: TravelerInfo[]
 *          }
 */
router.post('/book', authenticateUser, asyncHandler(bookFlight));

/**
 * @route   GET /flights/bookings/:bookingId
 * @desc    Get booking details
 * @access  Private (requires authentication)
 */
router.get('/bookings/:bookingId', authenticateUser, asyncHandler(getBooking));

export default router;
