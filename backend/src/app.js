const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const env = require('./core/config/env');
const errorHandler = require('./core/middleware/errorHandler');
const AppError = require('./core/utils/AppError');
const { setupSwagger } = require('./core/docs/swagger');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const pricingRoutes = require('./modules/pricing/pricing.routes');
const hubRoutes = require('./modules/hubs/hub.routes');
const listingRoutes = require('./modules/listings/listing.routes');
const orderRoutes = require('./modules/orders/order.routes');
const feedbackRoutes = require('./modules/feedback/feedback.routes');
const tierRoutes = require('./modules/tiers/tier.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

const app = express();

// Security middleware with Flutter Web compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Compression for high performance asset delivery
app.use(compression());

// Rate limiting (skipped in test mode)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/', authLimiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in dev
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded static files locally
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Mount Swagger OpenAPI Documentation
setupSwagger(app);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: env.APP_NAME,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/hubs', hubRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/tiers', tierRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Serve Flutter Web Frontend (D:\Closet Circle\lib built to build/web)
const fs = require('fs');
const flutterWebDir = path.resolve(__dirname, '../../build/web');
if (fs.existsSync(flutterWebDir)) {
  app.use(
    express.static(flutterWebDir, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (
          filePath.endsWith('index.html') ||
          filePath.endsWith('version.json') ||
          filePath.endsWith('flutter_service_worker.js')
        ) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(wasm|js|png|jpg|jpeg|svg|woff2|woff|ttf|otf)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
      }
    })
  );
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next(new AppError(`Endpoint ${req.originalUrl} not found on this server`, 404, 'NOT_FOUND'));
    }
    res.sendFile(path.join(flutterWebDir, 'index.html'));
  });
}

// 404 Route Not Found for APIs
app.use('*', (req, res, next) => {
  next(new AppError(`Endpoint ${req.originalUrl} not found on this server`, 404, 'NOT_FOUND'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
