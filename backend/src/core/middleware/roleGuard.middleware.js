const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Require specific system roles (e.g. 'admin', 'delivery_agent', 'hub_staff')
 * @param  {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const { role } = req.user;
    if (role === 'admin' || allowedRoles.includes(role)) {
      return next();
    }

    return next(new AppError(`Forbidden. Requires one of roles: ${allowedRoles.join(', ')}`, 403, 'FORBIDDEN_ROLE'));
  };
}

/**
 * Require specific user capability (e.g. 'lender', 'renter')
 * @param  {...string} requiredCapabilities
 */
function requireCapability(...requiredCapabilities) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    // Admins bypass capability checks
    if (req.user.role === 'admin') {
      return next();
    }

    const userCapabilities = req.user.capabilities || [];
    const hasCapability = requiredCapabilities.some(cap => userCapabilities.includes(cap));

    if (!hasCapability) {
      return next(
        new AppError(
          `Forbidden. Action requires account capability: ${requiredCapabilities.join(' or ')}`,
          403,
          'FORBIDDEN_CAPABILITY'
        )
      );
    }

    return next();
  };
}

/**
 * Guard for protected cron endpoints (e.g. nightly tier recomputation)
 * Allows call if valid CRON_SECRET is supplied in Authorization header (Bearer <CRON_SECRET>)
 * or if caller provides a valid Admin JWT access token.
 */
function requireCronSecretOrAdmin(req, res, next) {
  const env = require('../config/env');
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Check 1: Match CRON_SECRET directly
    if (token === env.CRON_SECRET) {
      return next();
    }

    // Check 2: Try verifying as JWT admin token
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (decoded.role === 'admin') {
        req.user = decoded;
        return next();
      }
    } catch (_) {
      // Ignored
    }
  }

  // Check 3: Already authenticated admin via prior middleware
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return next(new AppError('Unauthorized: Valid cron trigger secret or admin privilege required.', 401, 'CRON_UNAUTHORIZED'));
}

module.exports = {
  requireRole,
  requireCapability,
  requireCronSecretOrAdmin
};
