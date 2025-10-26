import { Router } from 'express';
import calendarRoutes from './calendarRoutes';
import dealsRoutes from './dealsRoutes';
import favoritesRoutes from './favoritesRoutes';
import aiRoutes from './aiRoutes';
import flightRoutes from './flightRoutes';

const router = Router();

// Health check endpoint
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

export default router;