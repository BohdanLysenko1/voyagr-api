import { Router } from 'express';
import { getDeals, getDeal, searchDeals } from '../controllers/dealsController';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Deals can be accessed with or without authentication
router.use(optionalAuth);

/**
 * @route   GET /deals
 * @desc    Get all deals
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(getDeals)
);

/**
 * @route   GET /deals/search
 * @desc    Search deals by filters
 * @access  Public
 */
router.get(
  '/search',
  asyncHandler(searchDeals)
);

/**
 * @route   GET /deals/:id
 * @desc    Get a single deal by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(getDeal)
);

export default router;