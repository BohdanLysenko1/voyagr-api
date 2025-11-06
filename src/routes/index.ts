import { Router } from 'express';
import calendarRoutes from './calendarRoutes';
import dealsRoutes from './dealsRoutes';
import favoritesRoutes from './favoritesRoutes';
import aiRoutes from './aiRoutes';
import flightRoutes from './flightRoutes';
import serpRoutes from './serp';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the API is running and responsive
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Voyagr API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Voyagr API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/calendar', calendarRoutes);
router.use('/deals', dealsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/ai', aiRoutes);
router.use('/flights', flightRoutes);
router.use('/serp', serpRoutes);

export default router;