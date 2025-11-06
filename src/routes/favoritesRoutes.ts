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
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags: [Favorites]
 *     description: Retrieve all favorited deals for authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
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
 *                     $ref: '#/components/schemas/Favorite'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  asyncHandler(getFavorites)
);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Add to favorites
 *     tags: [Favorites]
 *     description: Add a deal to user's favorites
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *             properties:
 *               dealId:
 *                 type: string
 *                 example: deal123
 *                 description: ID of the deal to favorite
 *     responses:
 *       201:
 *         description: Deal added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Favorite'
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
 */
router.post(
  '/',
  validate(addFavoriteValidation),
  asyncHandler(addFavorite)
);

/**
 * @swagger
 * /api/favorites/{id}:
 *   delete:
 *     summary: Remove from favorites
 *     tags: [Favorites]
 *     description: Remove a deal from favorites by favorite ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: fav123
 *         description: Favorite ID
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Favorite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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