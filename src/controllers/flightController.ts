import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

/**
 * Search for flights
 * GET /api/flights/search
 */
export const searchFlights = async (req: AuthRequest, res: Response): Promise<void> => {
  throw new AppError('Flight search service is not available', HTTP_STATUS.SERVICE_UNAVAILABLE);
};

/**
 * Confirm flight pricing before booking
 * POST /api/flights/price
 */
export const confirmFlightPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  throw new AppError('Flight pricing service is not available', HTTP_STATUS.SERVICE_UNAVAILABLE);
};

/**
 * Book a flight
 * POST /api/flights/book
 */
export const bookFlight = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new AppError('Authentication required to book flights', HTTP_STATUS.UNAUTHORIZED);
  }

  throw new AppError('Flight booking service is not available', HTTP_STATUS.SERVICE_UNAVAILABLE);
};

/**
 * Get booking details
 * GET /api/flights/bookings/:bookingId
 */
export const getBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  throw new AppError('Flight booking service is not available', HTTP_STATUS.SERVICE_UNAVAILABLE);
};
