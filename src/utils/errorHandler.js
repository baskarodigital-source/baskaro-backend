import mongoose from 'mongoose'

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

function sendError(res, statusCode, message, code, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    ...extra,
  })
}

function parseMongooseValidation(err) {
  const messages = Object.values(err.errors || {})
    .map((e) => e?.message)
    .filter(Boolean)
  return messages.length ? messages.join(', ') : 'Validation failed'
}

function parseDuplicateKeyField(err) {
  const keyPattern = err?.keyPattern || {}
  const keyValue = err?.keyValue || {}
  const field = Object.keys(keyPattern)[0] || Object.keys(keyValue)[0]
  return field || 'resource'
}

export const errorHandler = (err, req, res, _next) => {
  // Keep one centralized server-side log for debugging.
  console.error('[ErrorHandler]', {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    method: req?.method,
    path: req?.originalUrl || req?.url,
  })

  if (res.headersSent) return

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code)
  }

  // Body-parser / express.json size limit error
  if (err?.type === 'entity.too.large') {
    const isVideo = String(req.path || '').includes('/uploads/video')
    const message = isVideo
      ? 'Video is too large. Use a file under 50MB or compress it before uploading.'
      : 'Request body is too large.'
    return sendError(res, 413, message, errorCodes.BAD_REQUEST, { error: message })
  }

  // Multer upload errors
  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const isVideo = String(req.path || '').includes('/uploads/video')
      const message = isVideo
        ? 'Video is too large. Use a file under 50MB or compress it before uploading.'
        : 'Image is too large. Use a smaller file (max ~8MB).'
      return sendError(res, 400, message, errorCodes.BAD_REQUEST, { error: message })
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 400, 'Invalid upload field. Use "file".', errorCodes.BAD_REQUEST)
    }

    return sendError(res, 400, err.message || 'Upload failed', errorCodes.BAD_REQUEST)
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    return sendError(
      res,
      400,
      parseMongooseValidation(err),
      errorCodes.VALIDATION_ERROR,
    )
  }

  // Mongoose duplicate key error
  if (err?.code === 11000) {
    const field = parseDuplicateKeyField(err)
    return sendError(res, 409, `${field} already exists`, errorCodes.CONFLICT)
  }

  // Mongoose cast error (invalid ObjectId)
  if (err?.name === 'CastError') {
    return sendError(
      res,
      400,
      `Invalid ${err.path}: ${err.value}`,
      errorCodes.BAD_REQUEST,
    )
  }

  // JWT errors
  if (err?.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token', errorCodes.TOKEN_INVALID)
  }

  if (err?.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired', errorCodes.TOKEN_EXPIRED)
  }

  // Mongoose/server selection style errors
  if (err instanceof mongoose.Error) {
    return sendError(res, 500, err.message || 'Database error', errorCodes.DATABASE_ERROR)
  }

  // Default error
  return sendError(
    res,
    500,
    err?.message || 'Internal server error',
    errorCodes.INTERNAL_ERROR,
  )
}
