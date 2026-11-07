const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL || '*',
    credentials: true
  })
);

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

// 404 Route Not Found
app.use('*', (req, res, next) => {
  next(new AppError(`Endpoint ${req.originalUrl} not found on this server`, 404, 'NOT_FOUND'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
