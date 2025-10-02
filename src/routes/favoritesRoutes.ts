import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByDealId,
  checkFavorite,
} from '../controllers/favoritesController';
import { authenticateUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import {
  addFavoriteValidation,
  removeFavoriteValidation,
} from '../validators/favoritesValidators';

const router = Router();

// All favorites routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /favorites
 * @desc    Get all favorites for authenticated user
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(getFavorites)
);

/**
 * @route   POST /favorites
 * @desc    Add a deal to favorites
 * @access  Private
 */
router.post(
  '/',
  validate(addFavoriteValidation),
  asyncHandler(addFavorite)
);

/**
 * @route   DELETE /favorites/:id
 * @desc    Remove a favorite by favorite ID
 * @access  Private
 */
router.delete(
  '/:id',
  validate(removeFavoriteValidation),
  asyncHandler(removeFavorite)
);

/**
 * @route   DELETE /favorites/deal/:dealId
 * @desc    Remove a favorite by deal ID
 * @access  Private
 */
router.delete(
  '/deal/:dealId',
  asyncHandler(removeFavoriteByDealId)
);

/**
 * @route   GET /favorites/check/:dealId
 * @desc    Check if a deal is favorited
 * @access  Private
 */
router.get(
  '/check/:dealId',
  asyncHandler(checkFavorite)
);

export default router;