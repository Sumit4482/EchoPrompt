import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import promptRoutes from './routes/prompts';
import templateRoutes from './routes/templates';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import preferencesRoutes from './routes/preferences';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

let isDbConnected = false;

const initializeDatabase = async () => {
  const connection = await connectDatabase();
  isDbConnected = !!connection;

  if (isProduction && !isDbConnected) {
    console.error('MongoDB connection required in production');
    process.exit(1);
  }

  if (isDbConnected) {
    console.log('Application running with MongoDB persistence');
  } else {
    console.warn('Application running without persistence (development only)');
  }
};

const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: corsOrigin?.length
    ? corsOrigin
    : (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

app.use('/api/', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests from this IP, please try again later.', retryAfter: '15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user/preferences', preferencesRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api', (_req, res) => {
  res.json({
    name: 'EchoPrompt API',
    version: '1.0.0',
    description: 'Backend API for EchoPrompt - AI Prompt Generator',
    database: isDbConnected ? 'MongoDB (Connected)' : 'Disconnected',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      prompts: '/api/prompts',
      templates: '/api/templates',
      users: '/api/users',
      preferences: '/api/user/preferences',
      analytics: '/api/analytics',
    },
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path, method: req.method });
});

app.use(errorHandler);

const startServer = async () => {
  if (isProduction && !process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required in production');
    process.exit(1);
  }

  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`EchoPrompt API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${isDbConnected ? 'connected' : 'disconnected'}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
