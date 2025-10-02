import { Router } from 'express';
import { planTrip, chat } from '../controllers/aiController';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { aiPlanValidation, aiChatValidation } from '../validators/aiValidators';

const router = Router();

// AI routes can be accessed with or without authentication
router.use(optionalAuth);

/**
 * @route   POST /ai/plan
 * @desc    Generate AI-powered trip plan
 * @access  Public (with optional auth for personalization)
 */
router.post(
  '/plan',
  validate(aiPlanValidation),
  asyncHandler(planTrip)
);

/**
 * @route   POST /ai/chat
 * @desc    AI chat endpoint using Google Genkit
 * @access  Public (with optional auth for personalization)
 */
router.post(
  '/chat',
  validate(aiChatValidation),
  asyncHandler(chat)
);

export default router;