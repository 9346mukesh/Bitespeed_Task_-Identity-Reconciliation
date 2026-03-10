/**
 * Wraps an async route handler so thrown errors are forwarded to Express error middleware.
 * Eliminates the need for try/catch in every controller.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
