/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and sends a consistent JSON response.
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal server error";

  return res.status(statusCode).json({ error: message });
}

/**
 * Custom error class with HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
