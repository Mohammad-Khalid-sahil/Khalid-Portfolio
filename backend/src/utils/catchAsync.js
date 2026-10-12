/**
 * Wraps an async Express route handler and forwards rejected promises to
 * the error-handling middleware, instead of requiring try/catch everywhere.
 */
export function catchAsync(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
