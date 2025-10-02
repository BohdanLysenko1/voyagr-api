import { Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { AuthRequest } from '../models/types';
import { HTTP_STATUS } from '../config/constants';

/**
 * Middleware to verify Firebase authentication token
 * Extracts the token from Authorization header and verifies it
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No authentication token provided. Please include Bearer token in Authorization header.',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid authentication token format.',
      });
      return;
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await getAuth().verifyIdToken(token);

      // Attach user information to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };

      next();
    } catch (error: any) {
      console.error('Token verification error:', error.message);

      let message = 'Authentication failed. Invalid or expired token.';

      if (error.code === 'auth/id-token-expired') {
        message = 'Authentication token has expired. Please sign in again.';
      } else if (error.code === 'auth/id-token-revoked') {
        message = 'Authentication token has been revoked. Please sign in again.';
      } else if (error.code === 'auth/invalid-id-token') {
        message = 'Invalid authentication token. Please sign in again.';
      }

      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message,
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if token is missing
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      next();
      return;
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };
    } catch (error) {
      // Token invalid, but continue without authentication
      console.warn('Optional auth: Invalid token provided');
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};