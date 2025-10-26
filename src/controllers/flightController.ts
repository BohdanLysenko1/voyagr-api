import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { amadeus, isAmadeusConfigured } from '../config/amadeus';
import { TravelerInfo, FlightOrderRequest } from 'amadeus';

/**
 * Search for flights
 * GET /api/flights/search
 */
export const searchFlights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAmadeusConfigured()) {
      throw new AppError('Flight search service is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass,
      max = 10,
    } = req.query;

    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      throw new AppError(
        'Missing required parameters: originLocationCode, destinationLocationCode, departureDate',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const searchParams: any = {
      originLocationCode: originLocationCode as string,
      destinationLocationCode: destinationLocationCode as string,
      departureDate: departureDate as string,
      adults: Number(adults),
      max: Number(max),
    };

    if (returnDate) searchParams.returnDate = returnDate as string;
    if (children && Number(children) > 0) searchParams.children = Number(children);
    if (infants && Number(infants) > 0) searchParams.infants = Number(infants);
    if (travelClass) searchParams.travelClass = travelClass as string;

    const response = await amadeus().shopping.flightOffersSearch.get(searchParams);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        flights: response.data,
        meta: response.meta,
        dictionaries: response.dictionaries,
      },
      message: 'Flights retrieved successfully',
    });
  } catch (error: any) {
    console.error('Flight search error:', error);
    throw new AppError(
      error.description?.[0]?.title || 'Failed to search flights',
      error.code || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Confirm flight pricing before booking
 * POST /api/flights/price
 */
export const confirmFlightPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAmadeusConfigured()) {
      throw new AppError('Flight pricing service is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const { flightOffers } = req.body;

    if (!flightOffers || !Array.isArray(flightOffers)) {
      throw new AppError('Flight offers are required', HTTP_STATUS.BAD_REQUEST);
    }

    const response = await amadeus().shopping.flightOffers.pricing.post(
      JSON.stringify({
        data: {
          type: 'flight-offers-pricing',
          flightOffers,
        },
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response.data,
      message: 'Flight price confirmed',
    });
  } catch (error: any) {
    console.error('Flight pricing error:', error);
    throw new AppError(
      error.description?.[0]?.title || 'Failed to confirm flight price',
      error.code || HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Book a flight
 * POST /api/flights/book
 */
export const bookFlight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('Authentication required to book flights', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!isAmadeusConfigured()) {
      throw new AppError('Flight booking service is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const { flightOffers, travelers } = req.body;

    // Validate input
    if (!flightOffers || !Array.isArray(flightOffers) || flightOffers.length === 0) {
      throw new AppError('Flight offers are required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!travelers || !Array.isArray(travelers) || travelers.length === 0) {
      throw new AppError('Traveler information is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate traveler information
    for (const traveler of travelers) {
      if (!traveler.name?.firstName || !traveler.name?.lastName) {
        throw new AppError('Traveler first name and last name are required', HTTP_STATUS.BAD_REQUEST);
      }
      if (!traveler.dateOfBirth) {
        throw new AppError('Traveler date of birth is required', HTTP_STATUS.BAD_REQUEST);
      }
      if (!traveler.gender) {
        throw new AppError('Traveler gender is required', HTTP_STATUS.BAD_REQUEST);
      }
      if (!traveler.contact?.emailAddress) {
        throw new AppError('Traveler email address is required', HTTP_STATUS.BAD_REQUEST);
      }
      if (!traveler.contact?.phones || traveler.contact.phones.length === 0) {
        throw new AppError('Traveler phone number is required', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Create flight order
    const orderRequest: FlightOrderRequest = {
      data: {
        type: 'flight-order',
        flightOffers,
        travelers,
      },
    };

    const response = await amadeus().booking.flightOrders.post(
      JSON.stringify(orderRequest)
    );

    // Store booking in database (you'll need to implement this)
    // await storeBookingInDatabase(userId, response.data);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        booking: response.data,
        userId,
      },
      message: 'Flight booked successfully',
    });
  } catch (error: any) {
    console.error('Flight booking error:', error);

    // Handle Amadeus-specific errors
    if (error.response?.statusCode) {
      const errorMessage = error.description?.[0]?.title || error.description || 'Failed to book flight';
      throw new AppError(errorMessage, error.response.statusCode);
    }

    throw new AppError(
      'Failed to book flight. Please try again.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get booking details
 * GET /api/flights/bookings/:bookingId
 */
export const getBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const { bookingId } = req.params;

    if (!userId) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    // TODO: Implement database lookup
    // const booking = await getBookingFromDatabase(userId, bookingId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        message: 'Booking retrieval not yet implemented. Store bookings in your database.',
        bookingId,
        userId,
      },
      message: 'This endpoint needs database integration',
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    throw new AppError('Failed to retrieve booking', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};
