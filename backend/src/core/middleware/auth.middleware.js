const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Verifies Bearer JWT access token and attaches decoded payload to req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
}

/**
 * Optional authentication: decodes token if present, does not fail if absent
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      req.user = decoded;
    } catch (_) {
      // Ignored for optional
    }
  }
  return next();
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
