import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import * as serpApiService from '../services/serpApiService';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse query parameter as string
 */
const getStringParam = (
  value: any,
  paramName: string,
  required: boolean = true
): string | undefined => {
  if (!value) {
    if (required) {
      throw new AppError(`${paramName} is required`, HTTP_STATUS.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(`${paramName} must be a string`, HTTP_STATUS.BAD_REQUEST);
  }

  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new AppError(`${paramName} cannot be empty`, HTTP_STATUS.BAD_REQUEST);
  }

  return trimmed;
};

/**
 * Validate and parse query parameter as number
 */
const getNumberParam = (
  value: any,
  paramName: string,
  required: boolean = false
): number | undefined => {
  if (!value) {
    if (required) {
      throw new AppError(`${paramName} is required`, HTTP_STATUS.BAD_REQUEST);
    }
    return undefined;
  }

  const num = parseInt(value as string, 10);
  if (isNaN(num) || num < 0) {
    throw new AppError(`${paramName} must be a positive number`, HTTP_STATUS.BAD_REQUEST);
  }

  return num;
};

/**
 * Validate and parse comma-separated string array
 */
const getArrayParam = (value: any): string[] | undefined => {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDateFormat = (date: string, paramName: string): void => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new AppError(
      `${paramName} must be in YYYY-MM-DD format`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Check if date is valid
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError(`${paramName} is not a valid date`, HTTP_STATUS.BAD_REQUEST);
  }
};

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Search for restaurants in a destination
 * GET /api/serp/restaurants?destination=Paris&cuisine=Italian&priceLevel=$$&limit=10
 */
export const getRestaurants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if SERP API is configured
    if (!serpApiService.isSerpApiConfigured()) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'SERP API is not configured. Please contact the administrator.',
        data: [],
      });
      return;
    }

    // Extract and validate query parameters
    const destination = getStringParam(req.query.destination, 'destination', true)!;
    const cuisine = getStringParam(req.query.cuisine, 'cuisine', false);
    const priceLevel = getStringParam(req.query.priceLevel, 'priceLevel', false);
    const limit = getNumberParam(req.query.limit, 'limit', false);

    console.log(`📍 Restaurant search request: ${destination}`, {
      cuisine,
      priceLevel,
      limit,
      userId: req.user?.uid || 'anonymous',
    });

    // Call SERP API service
    const results = await serpApiService.searchRestaurants(destination, {
      cuisine,
      priceLevel,
      limit,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} restaurant${results.length !== 1 ? 's' : ''}`,
      metadata: {
        destination,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get restaurants error:', error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: [],
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch restaurants',
        data: [],
      });
    }
  }
};

/**
 * Search for attractions and things to do in a destination
 * GET /api/serp/attractions?destination=Paris&interests=culture,art&limit=15
 */
export const getAttractions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if SERP API is configured
    if (!serpApiService.isSerpApiConfigured()) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'SERP API is not configured. Please contact the administrator.',
        data: [],
      });
      return;
    }

    // Extract and validate query parameters
    const destination = getStringParam(req.query.destination, 'destination', true)!;
    const interests = getArrayParam(req.query.interests);
    const limit = getNumberParam(req.query.limit, 'limit', false);

    console.log(`📍 Attraction search request: ${destination}`, {
      interests,
      limit,
      userId: req.user?.uid || 'anonymous',
    });

    // Call SERP API service
    const results = await serpApiService.searchAttractions(destination, {
      interests,
      limit,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} attraction${results.length !== 1 ? 's' : ''}`,
      metadata: {
        destination,
        interests,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get attractions error:', error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: [],
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch attractions',
        data: [],
      });
    }
  }
};

/**
 * Search for hotels in a destination
 * GET /api/serp/hotels?destination=Paris&checkIn=2025-12-01&checkOut=2025-12-05&limit=10
 */
export const getHotels = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if SERP API is configured
    if (!serpApiService.isSerpApiConfigured()) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'SERP API is not configured. Please contact the administrator.',
        data: [],
      });
      return;
    }

    // Extract and validate query parameters
    const destination = getStringParam(req.query.destination, 'destination', true)!;
    const checkIn = getStringParam(req.query.checkIn, 'checkIn', false);
    const checkOut = getStringParam(req.query.checkOut, 'checkOut', false);
    const budget = getNumberParam(req.query.budget, 'budget', false);
    const limit = getNumberParam(req.query.limit, 'limit', false);

    // Validate date formats if provided
    if (checkIn) {
      validateDateFormat(checkIn, 'checkIn');
    }
    if (checkOut) {
      validateDateFormat(checkOut, 'checkOut');
    }

    // Validate that checkOut is after checkIn
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        throw new AppError(
          'Check-out date must be after check-in date',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    console.log(`📍 Hotel search request: ${destination}`, {
      checkIn,
      checkOut,
      budget,
      limit,
      userId: req.user?.uid || 'anonymous',
    });

    // Call SERP API service
    const results = await serpApiService.searchHotels(destination, {
      checkIn,
      checkOut,
      budget,
      limit,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} hotel${results.length !== 1 ? 's' : ''}`,
      metadata: {
        destination,
        checkIn,
        checkOut,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get hotels error:', error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: [],
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch hotels',
        data: [],
      });
    }
  }
};

/**
 * Search for flights between two destinations
 * GET /api/serp/flights?origin=NYC&destination=Paris&departureDate=2025-12-01&returnDate=2025-12-05&adults=2&cabinClass=economy
 */
export const getFlights = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if SERP API is configured
    if (!serpApiService.isSerpApiConfigured()) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'SERP API is not configured. Please contact the administrator.',
        data: [],
      });
      return;
    }

    // Extract and validate query parameters
    const origin = getStringParam(req.query.origin, 'origin', true)!;
    const destination = getStringParam(req.query.destination, 'destination', true)!;
    const departureDate = getStringParam(req.query.departureDate, 'departureDate', true)!;
    const returnDate = getStringParam(req.query.returnDate, 'returnDate', false);
    const adults = getNumberParam(req.query.adults, 'adults', false) || 1;
    const children = getNumberParam(req.query.children, 'children', false) || 0;
    const cabinClass = getStringParam(req.query.cabinClass, 'cabinClass', false) as
      | 'economy'
      | 'premium_economy'
      | 'business'
      | 'first'
      | undefined;
    const limit = getNumberParam(req.query.limit, 'limit', false);

    // Validate date formats
    validateDateFormat(departureDate, 'departureDate');
    if (returnDate) {
      validateDateFormat(returnDate, 'returnDate');

      // Validate that returnDate is after departureDate
      const depDate = new Date(departureDate);
      const retDate = new Date(returnDate);
      if (retDate <= depDate) {
        throw new AppError(
          'Return date must be after departure date',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Validate cabin class
    const validCabinClasses = ['economy', 'premium_economy', 'business', 'first'];
    if (cabinClass && !validCabinClasses.includes(cabinClass)) {
      throw new AppError(
        `Invalid cabin class. Must be one of: ${validCabinClasses.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    console.log(`📍 Flight search request: ${origin} → ${destination}`, {
      departureDate,
      returnDate,
      adults,
      children,
      cabinClass,
      limit,
      userId: req.user?.uid || 'anonymous',
    });

    // Call SERP API service
    const results = await serpApiService.searchFlights(
      origin,
      destination,
      departureDate,
      returnDate,
      {
        adults,
        children,
        cabinClass: cabinClass || 'economy',
        limit,
      }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} flight${results.length !== 1 ? 's' : ''}`,
      metadata: {
        origin,
        destination,
        departureDate,
        returnDate,
        tripType: returnDate ? 'round-trip' : 'one-way',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get flights error:', error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: [],
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch flights',
        data: [],
      });
    }
  }
};

/**
 * GET /api/serp/flight-booking-options
 * Get booking options for a specific flight using booking_token
 */
export const getFlightBookingOptions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingToken } = req.query;

    // Validate required parameters
    if (!bookingToken || typeof bookingToken !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required parameter: bookingToken',
        data: [],
      });
      return;
    }

    console.log('📋 Fetching booking options:', {
      bookingToken: bookingToken.substring(0, 50) + '...',
      userId: req.user?.uid || 'anonymous',
    });

    // Call SERP API service
    const results = await serpApiService.getFlightBookingOptions(bookingToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      count: results.length,
      message: `Found ${results.length} booking option${results.length !== 1 ? 's' : ''}`,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get booking options error:', error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: [],
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch booking options',
        data: [],
      });
    }
  }
};

/**
 * Get SERP API health status
 * GET /api/serp/health
 */
export const getHealthStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const isConfigured = serpApiService.isSerpApiConfigured();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        configured: isConfigured,
        status: isConfigured ? 'available' : 'not_configured',
        message: isConfigured
          ? 'SERP API is configured and ready'
          : 'SERP API key is not configured',
      },
      message: 'Health check completed',
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Health check failed',
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getRestaurants,
  getAttractions,
  getHotels,
  getFlights,
  getHealthStatus,
};
