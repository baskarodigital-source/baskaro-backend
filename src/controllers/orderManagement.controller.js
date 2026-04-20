import { successResponse } from '../utils/helpers.js'
import * as orderManagementService from '../services/orderManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Create order
export async function createOrder(req, res) {
  const orderData = req.body
  
  // Add userId from authenticated user
  if (req.user && req.user.userId) {
    orderData.userId = req.user.userId
  }
  
  const order = await orderManagementService.createOrder(orderData)
  return successResponse(res, order, 'Order created successfully', 201)
}

// Get all orders
export async function getAllOrders(req, res) {
  const filters = req.query
  
  // If not admin, only show user's own orders
  if (!req.user || !['admin', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user.role)) {
    filters.userId = req.user?.userId
  }
  
  const data = await orderManagementService.getAllOrders(filters)
  return successResponse(res, data, 'Orders retrieved successfully')
}

// Get order by ID
export async function getOrderById(req, res) {
  const { orderId } = req.params
  const order = await orderManagementService.getOrderById(orderId)
  return successResponse(res, order, 'Order retrieved successfully')
}

// Update order status
export async function updateOrderStatus(req, res) {
  const { orderId } = req.params
  const { status, notes } = req.body
  
  if (!status) {
    throw new AppError('Status is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const order = await orderManagementService.updateOrderStatus(orderId, status, notes)
  return successResponse(res, order, 'Order status updated successfully')
}

// Cancel order
export async function cancelOrder(req, res) {
  const { orderId } = req.params
  const { reason } = req.body
  
  const order = await orderManagementService.cancelOrder(orderId, reason)
  return successResponse(res, order, 'Order cancelled successfully')
}

// Apply coupon to order
export async function applyCoupon(req, res) {
  const { orderId } = req.params
  const { couponCode } = req.body
  
  if (!couponCode) {
    throw new AppError('Coupon code is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const result = await orderManagementService.applyCouponToOrder(orderId, couponCode)
  return successResponse(res, result, 'Coupon applied successfully')
}
