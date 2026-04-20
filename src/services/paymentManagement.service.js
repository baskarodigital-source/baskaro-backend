import mongoose from 'mongoose'
import { Payment } from '../models/Payment.js'
import { Order } from '../models/Order.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Initiate payment
export async function initiatePayment(paymentData) {
  const session = await mongoose.startSession()
  session.startTransaction()
  
  try {
    // Validate order exists and is in PRICE_FINALIZED status
    const order = await Order.findById(paymentData.orderId).session(session)
    if (!order) {
      throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
    }
    
    if (order.status !== 'PRICE_FINALIZED') {
      throw new AppError('Payment can only be initiated after price is finalized', 400, errorCodes.BAD_REQUEST)
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId: paymentData.orderId }).session(session)
    if (existingPayment) {
      throw new AppError('Payment already initiated for this order', 409, errorCodes.CONFLICT)
    }
    
    const payment = await Payment.create([{
      orderId: paymentData.orderId,
      userId: order.userId,
      amount: order.finalPrice,
      method: paymentData.method,
      status: 'PENDING',
    }], { session })
    
    await session.commitTransaction()
    return payment[0]
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// Update payment status
export async function updatePaymentStatus(paymentId, status, transactionId = '') {
  const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
  
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid payment status', 400, errorCodes.BAD_REQUEST)
  }
  
  const payment = await Payment.findById(paymentId)
  if (!payment) {
    throw new AppError('Payment not found', 404, errorCodes.NOT_FOUND)
  }
  
  payment.status = status
  if (transactionId) {
    payment.transactionId = transactionId
  }
  
  if (status === 'PAID') {
    payment.paidAt = new Date()
    
    // Update order status to COMPLETED
    await Order.findByIdAndUpdate(payment.orderId, {
      status: 'COMPLETED',
      statusHistory: [{
        status: 'COMPLETED',
        at: new Date(),
        notes: 'Payment completed successfully'
      }]
    })
  } else if (status === 'FAILED') {
    // Optionally update order status
    await Order.findByIdAndUpdate(payment.orderId, {
      statusHistory: [{
        status: 'PRICE_FINALIZED',
        at: new Date(),
        notes: 'Payment failed'
      }]
    })
  }
  
  await payment.save()
  
  return payment
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId) {
  const payment = await Payment.findOne({ orderId })
    .populate('orderId', 'status finalPrice')
    .populate('userId', 'name email phone')
  
  if (!payment) {
    throw new AppError('Payment not found', 404, errorCodes.NOT_FOUND)
  }
  
  return payment
}

// Get all payments
export async function getAllPayments({ page = 1, limit = 10, status = '' }) {
  const query = {}
  
  if (status && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(status)) {
    query.status = status
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit)
  
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('orderId', 'status finalPrice brand modelName')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ])
  
  return {
    items: payments,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: page * limit < total,
    },
  }
}
