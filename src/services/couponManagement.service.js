import { Coupon } from '../models/Coupon.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Create coupon
export async function createCoupon(couponData) {
  // Check if code already exists
  const existing = await Coupon.findOne({ code: couponData.code.toUpperCase() })
  if (existing) {
    throw new AppError('Coupon with this code already exists', 409, errorCodes.CONFLICT)
  }
  
  const coupon = await Coupon.create(couponData)
  return coupon
}

// Get all coupons
export async function getAllCoupons({ page = 1, limit = 10, active = true }) {
  const query = {}
  if (active !== null) {
    query.isActive = active
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit)
  
  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Coupon.countDocuments(query),
  ])
  
  return {
    items: coupons,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: page * limit < total,
    },
  }
}

// Get coupon by ID
export async function getCouponById(couponId) {
  const coupon = await Coupon.findById(couponId)
  
  if (!coupon) {
    throw new AppError('Coupon not found', 404, errorCodes.NOT_FOUND)
  }
  
  return coupon
}

// Get coupon by code
export async function getCouponByCode(code) {
  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
    expiryDate: { $gte: new Date() }
  })
  
  if (!coupon) {
    throw new AppError('Invalid or expired coupon', 404, errorCodes.NOT_FOUND)
  }
  
  // Check usage limit
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400, errorCodes.BAD_REQUEST)
  }
  
  return coupon
}

// Update coupon
export async function updateCoupon(couponId, updateData) {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!coupon) {
    throw new AppError('Coupon not found', 404, errorCodes.NOT_FOUND)
  }
  
  return coupon
}

// Disable coupon
export async function disableCoupon(couponId) {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    { isActive: false },
    { new: true, runValidators: true }
  )
  
  if (!coupon) {
    throw new AppError('Coupon not found', 404, errorCodes.NOT_FOUND)
  }
  
  return coupon
}

// Delete coupon
export async function deleteCoupon(couponId) {
  const coupon = await Coupon.findByIdAndDelete(couponId)
  
  if (!coupon) {
    throw new AppError('Coupon not found', 404, errorCodes.NOT_FOUND)
  }
  
  return { success: true, message: 'Coupon deleted successfully' }
}
