import { successResponse } from '../utils/helpers.js'
import {
  createRazorpayOrderForPurchase,
  getRazorpayKeyId,
  handleRazorpayWebhook,
  mockCompletePayment,
  completeBuyPayment,
} from '../services/razorpay.service.js'
import { getAuthUserId } from '../middleware/auth.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function requireUserId(req) {
  const userId = getAuthUserId(req)
  if (!userId) {
    throw new AppError('Unauthenticated', 401, errorCodes.AUTH_FAILED)
  }
  return userId
}

export async function createRazorpayOrder(req, res) {
  const userId = requireUserId(req)
  const { purchaseOrderId } = req.body || {}
  if (!purchaseOrderId) {
    return res.status(400).json({ success: false, message: 'purchaseOrderId is required', code: 'BAD_REQUEST' })
  }
  const data = await createRazorpayOrderForPurchase(userId, purchaseOrderId)
  return successResponse(res, data, 'Razorpay order created successfully', 201)
}

export async function verifyRazorpayPayment(req, res) {
  const userId = requireUserId(req)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      code: 'BAD_REQUEST',
    })
  }

  const result = await completeBuyPayment({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    source: 'client',
  })

  if (String(result.payment.userId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' })
  }

  return successResponse(res, result, 'Payment verified successfully')
}

export async function mockPayOrder(req, res) {
  const userId = requireUserId(req)
  const { purchaseOrderId } = req.body || {}
  if (!purchaseOrderId) {
    return res.status(400).json({ success: false, message: 'purchaseOrderId is required', code: 'BAD_REQUEST' })
  }
  const result = await mockCompletePayment(userId, purchaseOrderId)
  return successResponse(res, result, 'Mock payment completed')
}

export async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature']
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing signature' })
  }
  const result = await handleRazorpayWebhook(req.body, signature)
  return res.json({ success: true, result })
}

export async function getRazorpayConfig(_req, res) {
  return successResponse(res, { keyId: getRazorpayKeyId() }, 'Razorpay config')
}
