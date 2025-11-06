import { Router } from 'express';
import { planTrip, chat, getPopularCities, getPopularCountries } from '../controllers/aiController';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { aiPlanValidation, aiChatValidation } from '../validators/aiValidators';

const router = Router();

// AI routes can be accessed with or without authentication
router.use(optionalAuth);

/**
 * @swagger
 * /api/ai/plan:
 *   post:
 *     summary: Generate AI-powered trip plan
 *     tags: [AI]
 *     description: Generate a personalized trip itinerary using AI based on destination, dates, budget, and interests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AITripRequest'
 *           examples:
 *             paris_trip:
 *               summary: Paris trip example
 *               value:
 *                 destination: "Paris, France"
 *                 dates:
 *                   start: "2025-12-01"
 *                   end: "2025-12-05"
 *                 budget: "moderate"
 *                 interests: ["culture", "food", "history"]
 *                 travelers: 2
 *     responses:
 *       200:
 *         description: Trip plan generated successfully
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
 *                     itinerary:
 *                       type: array
 *                       items:
 *                         type: object
 *                     attractions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     restaurants:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request parameters
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
router.post(
  '/plan',
  validate(aiPlanValidation),
  asyncHandler(planTrip)
);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI chat endpoint
 *     tags: [AI]
 *     description: Chat with AI assistant powered by Google Genkit for travel-related queries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What are the best places to visit in Paris?"
 *               conversationId:
 *                 type: string
 *                 example: "conv_123456"
 *                 description: Optional conversation ID to continue a previous chat
 *     responses:
 *       200:
 *         description: AI response generated successfully
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
 *                     message:
 *                       type: string
 *                       example: "Here are the top attractions in Paris..."
 *                     conversationId:
 *                       type: string
 *                       example: "conv_123456"
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
router.post(
  '/chat',
  validate(aiChatValidation),
  asyncHandler(chat)
);

/**
 * @swagger
 * /api/ai/countries:
 *   post:
 *     summary: Get popular travel destination countries
 *     tags: [AI]
 *     description: Get 5 popular travel destination countries for trip planning wizard
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {}
 *     responses:
 *       200:
 *         description: List of popular countries
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
 *                     countries:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["France", "Italy", "Japan", "Spain", "United States"]
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                           example: "gemini-2.5-flash"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Server error (fallback to hardcoded list)
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
 *                     countries:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post(
  '/countries',
  asyncHandler(getPopularCountries)
);

/**
 * @swagger
 * /api/ai/cities:
 *   post:
 *     summary: Get popular cities for a country
 *     tags: [AI]
 *     description: Get top 5 popular tourist cities for a given country using AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *             properties:
 *               country:
 *                 type: string
 *                 example: "France"
 *     responses:
 *       200:
 *         description: List of popular cities
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
 *                     cities:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux"]
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                           example: "gemini-2.5-flash"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/cities',
  asyncHandler(getPopularCities)
);

export default router;