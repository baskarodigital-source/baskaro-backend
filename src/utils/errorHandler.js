// Centralized error handler
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorCodes = {
  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Not found errors
  NOT_FOUND: 'NOT_FOUND',
  
  // Conflict errors
  CONFLICT: 'CONFLICT',
  
  // Forbidden errors
  FORBIDDEN: 'FORBIDDEN',
  
  // Bad request
  BAD_REQUEST: 'BAD_REQUEST',
  
  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ')
    return res.status(400).json({
      success: false,
      message: messages,
      code: errorCodes.VALIDATION_ERROR,
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: errorCodes.CONFLICT,
    })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: errorCodes.BAD_REQUEST,
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: errorCodes.TOKEN_INVALID,
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: errorCodes.TOKEN_EXPIRED,
    })
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: errorCodes.INTERNAL_ERROR,
  })
}
