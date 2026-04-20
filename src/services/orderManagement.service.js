import mongoose from 'mongoose'
import { Order, ORDER_STATUS_VALUES } from '../models/Order.js'
import { User } from '../models/User.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { Coupon } from '../models/Coupon.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination, formatPaginationResponse } from '../utils/helpers.js'

// Create order
export async function createOrder(orderData) {
  const session = await mongoose.startSession()
  session.startTransaction()
  
  try {
    // Validate user exists
    const user = await User.findById(orderData.userId).session(session)
    if (!user) {
      throw new AppError('User not found', 404, errorCodes.NOT_FOUND)
    }
    
    // Validate phone model exists
    const phoneModel = await PhoneModel.findById(orderData.modelId).session(session)
    if (!phoneModel) {
      throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
    }
    
    // Find the storage variant to get base price
    const variant = phoneModel.storageVariants.find(v => v.label === orderData.storage)
    const basePrice = variant ? variant.basePrice : phoneModel.basePrice
    
    // Calculate final price (can be enhanced with device condition service)
    const calculatedPrice = basePrice
    const finalPrice = calculatedPrice - (orderData.couponDiscount || 0)
    
    // Create status history entry
    const statusHistory = [{
      status: 'PLACED',
      at: new Date(),
      notes: 'Order placed successfully'
    }]
    
    const order = await Order.create([{
      ...orderData,
      basePrice,
      calculatedPrice,
      finalPrice,
      statusHistory,
    }], { session })
    
    // Update user's total orders
    await User.findByIdAndUpdate(orderData.userId, {
      $inc: { totalOrders: 1 }
    }, { session })
    
    await session.commitTransaction()
    
    return order[0]
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// Get all orders with filters and pagination
export async function getAllOrders({ 
  page = 1, 
  limit = 10, 
  status = '', 
  userId = '',
  brandId = '',
  startDate = '',
  endDate = ''
}) {
  const { skip } = getPagination(page, limit)
  
  const query = {}
  
  if (status && ORDER_STATUS_VALUES.includes(status)) {
    query.status = status
  }
  
  if (userId) {
    query.userId = userId
  }
  
  if (brandId) {
    query.brandId = brandId
  }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email phone')
      .populate('brandId', 'name slug')
      .populate('modelId', 'modelName slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ])
  
  return formatPaginationResponse(orders, total, page, limit)
}

// Get order by ID
export async function getOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate('userId', 'name email phone')
    .populate('brandId', 'name slug')
    .populate('modelId', 'modelName slug specifications')
  
  if (!order) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  
  return order
}

// Update order status
export async function updateOrderStatus(orderId, status, notes = '') {
  if (!ORDER_STATUS_VALUES.includes(status)) {
    throw new AppError('Invalid order status', 400, errorCodes.BAD_REQUEST)
  }
  
  const order = await Order.findById(orderId)
  if (!order) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  
  // Add to status history
  order.statusHistory.push({
    status,
    at: new Date(),
    notes
  })
  
  order.status = status
  await order.save()
  
  return order
}

// Cancel order
export async function cancelOrder(orderId, reason = '') {
  const order = await Order.findById(orderId)
  
  if (!order) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    throw new AppError('Cannot cancel order that is already completed or cancelled', 400, errorCodes.BAD_REQUEST)
  }
  
  order.status = 'CANCELLED'
  order.statusHistory.push({
    status: 'CANCELLED',
    at: new Date(),
    notes: reason || 'Order cancelled by user'
  })
  
  await order.save()
  
  return order
}

// Apply coupon to order
export async function applyCouponToOrder(orderId, couponCode) {
  const order = await Order.findById(orderId)
  if (!order) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  
  const coupon = await Coupon.findOne({ 
    code: couponCode.toUpperCase(),
    isActive: true,
    expiryDate: { $gte: new Date() }
  })
  
  if (!coupon) {
    throw new AppError('Invalid or expired coupon', 400, errorCodes.BAD_REQUEST)
  }
  
  // Check usage limit
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400, errorCodes.BAD_REQUEST)
  }
  
  // Check minimum order amount
  if (coupon.minOrderAmount > 0 && order.finalPrice < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required`, 400, errorCodes.BAD_REQUEST)
  }
  
  const discountAmount = Math.min(
    (order.calculatedPrice * coupon.discountPercent) / 100,
    coupon.maxDiscountAmount || order.calculatedPrice
  )
  
  order.couponCode = coupon.code
  order.couponDiscount = discountAmount
  order.finalPrice = order.calculatedPrice - discountAmount
  
  await order.save()
  
  // Increment coupon usage
  await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
  
  return {
    order,
    coupon,
    discountApplied: discountAmount,
  }
}
