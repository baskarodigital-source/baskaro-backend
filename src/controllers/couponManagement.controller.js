import { successResponse } from '../utils/helpers.js'
import * as couponManagementService from '../services/couponManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Create coupon
export async function createCoupon(req, res) {
  const couponData = req.body
  const coupon = await couponManagementService.createCoupon(couponData)
  return successResponse(res, coupon, 'Coupon created successfully', 201)
}

// Get all coupons
export async function getAllCoupons(req, res) {
  const { page = 1, limit = 10, active = true } = req.query
  const data = await couponManagementService.getAllCoupons({ page, limit, active })
  return successResponse(res, data, 'Coupons retrieved successfully')
}

// Get coupon by ID
export async function getCouponById(req, res) {
  const { couponId } = req.params
  const coupon = await couponManagementService.getCouponById(couponId)
  return successResponse(res, coupon, 'Coupon retrieved successfully')
}

// Get coupon by code
export async function getCouponByCode(req, res) {
  const { code } = req.params
  const coupon = await couponManagementService.getCouponByCode(code)
  return successResponse(res, coupon, 'Coupon retrieved successfully')
}

// Update coupon
export async function updateCoupon(req, res) {
  const { couponId } = req.params
  const updateData = req.body
  const coupon = await couponManagementService.updateCoupon(couponId, updateData)
  return successResponse(res, coupon, 'Coupon updated successfully')
}

// Disable coupon
export async function disableCoupon(req, res) {
  const { couponId } = req.params
  const coupon = await couponManagementService.disableCoupon(couponId)
  return successResponse(res, coupon, 'Coupon disabled successfully')
}

// Delete coupon
export async function deleteCoupon(req, res) {
  const { couponId } = req.params
  const result = await couponManagementService.deleteCoupon(couponId)
  return successResponse(res, result, 'Coupon deleted successfully')
}
