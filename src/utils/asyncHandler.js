/**
 * Express 4 does not forward rejected promises from async route handlers.
 * Wrap handlers so `AppError` and other errors reach `errorHandler` via `next(err)`.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
