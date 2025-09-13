import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
//import { apiLimiter } from "./middleware/rateLimiter";


// Import configurations and utilities
import { initializeDatabase, createTables } from './config/database';
import { logApi, logDatabase } from './utils/logger';
import enquiriesRouter from './routes/enquiries';
import pickupRouter from './routes/pickup';
import serviceRouter from './routes/service';
import billingRouter from './routes/billing';
import deliveryRoutes from './routes/delivery';
import completedRouter from './routes/completed';
import expensesRouter from './routes/expenses';
import inventoryRouter from './routes/inventory';
import dashboardRouter from './routes/dashboard';
import reportRoutes from './routes/report';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8080;

//app.use("/api", apiLimiter);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3000',
    'https://cobbler-local-8k7t.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Token', 'Origin', 'Accept', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100000000'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logApi.request('HTTP', message.trim(), 'unknown', 'morgan');
    }
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timing middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log request start
  logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    logApi.response(req.method, req.url, res.statusCode, duration);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Health check endpoints (must be before other routes)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cobbler Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cobbler Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/pickup', pickupRouter);
app.use('/api/services', serviceRouter);
app.use('/api/billing', billingRouter);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/completed', completedRouter);
app.use('/api/expense', expensesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportRoutes);



// ALWAYS serve uploaded files
app.use('/bills', express.static(path.join(process.cwd(), 'public/bills')));

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the public directory (frontend build)
  app.use(express.static(path.join(__dirname, '../public')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Skip API routes - but health endpoints should be handled above
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        error: 'API route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    }

    // Serve the React app for all other routes
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    logApi.error(req.method, req.url, new Error('Route not found'));
    res.status(404).json({
      success: false,
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });
}

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logApi.error(req.method, req.url, error);

  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logDatabase.connection('Database connection established successfully');

    // Create database tables
    await createTables();
    logDatabase.success('Database tables created/verified successfully');

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Cobbler Backend API server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
      console.log(`📝 Logs directory: ${process.env.LOG_FILE_PATH || './logs'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;