import { successResponse } from '../utils/helpers.js'
import * as paymentManagementService from '../services/paymentManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Initiate payment
export async function initiatePayment(req, res) {
  const paymentData = req.body
  const payment = await paymentManagementService.initiatePayment(paymentData)
  return successResponse(res, payment, 'Payment initiated successfully', 201)
}

// Update payment status
export async function updatePaymentStatus(req, res) {
  const { paymentId } = req.params
  const { status, transactionId } = req.body
  
  if (!status) {
    throw new AppError('Status is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const payment = await paymentManagementService.updatePaymentStatus(paymentId, status, transactionId)
  return successResponse(res, payment, 'Payment status updated successfully')
}

// Get payment by order ID
export async function getPaymentByOrderId(req, res) {
  const { orderId } = req.params
  const payment = await paymentManagementService.getPaymentByOrderId(orderId)
  return successResponse(res, payment, 'Payment details retrieved successfully')
}

// Get all payments
export async function getAllPayments(req, res) {
  const { page = 1, limit = 10, status = '' } = req.query
  const data = await paymentManagementService.getAllPayments({ page, limit, status })
  return successResponse(res, data, 'Payments retrieved successfully')
}
