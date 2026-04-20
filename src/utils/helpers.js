import mongoose from 'mongoose'

// Standard success response format
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

// Standard error response format
export const errorResponse = (res, message = 'Error', statusCode = 400, code = 'BAD_REQUEST') => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  })
}

// Pagination helper
export const getPagination = (page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit)
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page),
  }
}

// Format pagination response
export const formatPaginationResponse = (data, total, page, limit) => {
  return {
    items: data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: page * limit < total,
    },
  }
}

// Validate ObjectId
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}
