/**
 * Standardized JSON response helpers
 */

function successResponse(res, data = null, message = 'Success', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errorCode = 'ERROR', details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = {
  successResponse,
  errorResponse
};
