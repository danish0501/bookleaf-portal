import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export function createApp(): Application {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body Parsing & Cookies
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // General Rate Limiter (200 requests per 15 minutes)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests from this IP address. Please try again later.',
    },
  });

  // Login Rate Limiter (30 attempts per 15 minutes)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many login attempts. Please try again after 15 minutes.',
    },
  });

  app.use('/api/', apiLimiter);
  app.use('/api/v1/auth/login', loginLimiter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'BookLeaf Author Support Portal API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      aiModel: env.GEMINI_MODEL,
      hasGeminiApiKey: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== ''),
    });
  });

  // API Version 1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/author', authorRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 404 handler for unknown routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
