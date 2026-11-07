const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'DB_VALIDATION_ERROR';
    message = 'Database validation failed';
    details = Object.values(err.errors).map(e => ({
      path: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID_FORMAT';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // In production, mask internal server errors unless marked operational
  if (statusCode === 500 && env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'An unexpected internal error occurred';
    details = null;
  }

  // Log error if 500
  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error('[Unhandled Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = errorHandler;

