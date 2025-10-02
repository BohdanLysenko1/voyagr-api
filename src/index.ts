import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 4000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize Firebase Admin SDK
 */
try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase. Server will not start.');
  process.exit(1);
}

/**
 * Security Middleware
 */
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = WEB_ORIGIN.split(',').map(o => o.trim());

    if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
}));

/**
 * General Middleware
 */
// Compress response bodies
app.use(compression());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * API Routes
 */
// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Voyagr API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', routes);

// Legacy routes (for backward compatibility)
app.use('/deals', routes);
app.use('/ai', routes);

/**
 * Error Handling
 */
// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`🚀 Voyagr API Server`);
  console.log(`🚀 Environment: ${NODE_ENV}`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 CORS Origin: ${WEB_ORIGIN}`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/api/health`);
  console.log('🚀 ========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('🚀 Press CTRL+C to stop');
  console.log('🚀 ========================================\n');
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log to a service or exit the process
  if (NODE_ENV === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

export default app;