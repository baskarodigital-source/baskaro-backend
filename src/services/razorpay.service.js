import crypto from 'node:crypto'
import { BuyPayment } from '../models/BuyPayment.js'
import { getBuyOrderById, markBuyOrderPaid } from './buyOrders.service.js'
import { confirmInventorySale } from './inventoryReservation.service.js'
import { sendBuyOrderConfirmation } from './orderNotification.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

function basicAuthHeader() {
  const key = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`
}

async function razorpayFetch(path, body) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.description || data?.message || 'Razorpay request failed'
    throw new AppError(msg, 502, errorCodes.INTERNAL_ERROR)
  }
  return data
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || ''
}

export async function createRazorpayOrderForPurchase(userId, purchaseOrderId) {
  const order = await getBuyOrderById(purchaseOrderId)
  if (String(order.userId) !== String(userId)) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  if (order.status !== 'PAYMENT_PENDING' && order.status !== 'PLACED') {
    throw new AppError('Order is not awaiting payment', 400, errorCodes.BAD_REQUEST)
  }

  const amountPaise = Math.round(order.totalInr * 100)
  if (amountPaise < 100) {
    throw new AppError('Order total is too low for payment', 400, errorCodes.BAD_REQUEST)
  }

  let existing = await BuyPayment.findOne({ purchaseOrderId: order._id })
  if (existing?.status === 'PAID') {
    throw new AppError('Order is already paid', 409, errorCodes.CONFLICT)
  }

  let razorpayOrderId = existing?.razorpayOrderId || ''

  if (razorpayConfigured()) {
    const rpOrder = await razorpayFetch('/orders', {
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        purchaseOrderId: String(order._id),
        userId: String(userId),
      },
    })
    razorpayOrderId = rpOrder.id
  } else {
    razorpayOrderId = `dev_order_${order._id}`
  }

  if (existing) {
    existing.amountInr = order.totalInr
    existing.amountPaise = amountPaise
    existing.razorpayOrderId = razorpayOrderId
    existing.status = 'PENDING'
    await existing.save()
  } else {
    existing = await BuyPayment.create({
      purchaseOrderId: order._id,
      userId,
      amountInr: order.totalInr,
      amountPaise,
      razorpayOrderId,
      status: 'PENDING',
    })
  }

  return {
    keyId: getRazorpayKeyId(),
    razorpayOrderId,
    amountPaise,
    amountInr: order.totalInr,
    currency: 'INR',
    purchaseOrderId: String(order._id),
    orderNumber: order.orderNumber,
    mockMode: !razorpayConfigured(),
    paymentId: String(existing._id),
  }
}

export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return expected === razorpaySignature
}

export async function completeBuyPayment({
  razorpayOrderId,
  razorpayPaymentId = '',
  razorpaySignature = '',
  source = 'client',
}) {
  const payment = await BuyPayment.findOne({ razorpayOrderId })
  if (!payment) throw new AppError('Payment not found', 404, errorCodes.NOT_FOUND)
  if (payment.status === 'PAID') {
    const order = await getBuyOrderById(payment.purchaseOrderId)
    return { payment, order, alreadyPaid: true }
  }

  if (razorpayConfigured() && source === 'client') {
    const ok = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
    if (!ok) throw new AppError('Invalid payment signature', 400, errorCodes.BAD_REQUEST)
  }

  payment.status = 'PAID'
  payment.razorpayPaymentId = razorpayPaymentId || payment.razorpayPaymentId
  payment.razorpaySignature = razorpaySignature || payment.razorpaySignature
  payment.paidAt = new Date()
  await payment.save()

  const order = await markBuyOrderPaid(payment.purchaseOrderId, `Payment captured via ${source}`)

  for (const line of order.lineItems) {
    await confirmInventorySale(line.inventoryId)
  }

  // Non-blocking business notification layer (email/SMS); failures are logged only.
  try {
    const notification = await sendBuyOrderConfirmation({ order })
    payment.gatewayResponse = {
      ...(payment.gatewayResponse || {}),
      notification,
    }
    await payment.save()
  } catch (err) {
    console.error('[Notifications] Buy order confirmation failed:', err?.message || err)
  }

  return { payment, order, alreadyPaid: false }
}

/** Dev-only: simulate successful payment when Razorpay keys are not configured. */
export async function mockCompletePayment(userId, purchaseOrderId) {
  if (razorpayConfigured()) {
    throw new AppError('Mock payment is disabled when Razorpay is configured', 400, errorCodes.BAD_REQUEST)
  }

  const payment = await BuyPayment.findOne({ purchaseOrderId })
  if (!payment || String(payment.userId) !== String(userId)) {
    throw new AppError('Payment not found', 404, errorCodes.NOT_FOUND)
  }

  return completeBuyPayment({
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: `dev_pay_${Date.now()}`,
    source: 'mock',
  })
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return expected === signature
}

export async function handleRazorpayWebhook(rawBody, signature) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 400, errorCodes.BAD_REQUEST)
  }

  const event = JSON.parse(rawBody.toString('utf8'))
  const eventName = event?.event
  const entity = event?.payload?.payment?.entity

  if (eventName === 'payment.captured' && entity?.order_id) {
    return completeBuyPayment({
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
      source: 'webhook',
    })
  }

  if (eventName === 'payment.failed' && entity?.order_id) {
    await BuyPayment.findOneAndUpdate(
      { razorpayOrderId: entity.order_id },
      { status: 'FAILED', gatewayResponse: entity },
    )
  }

  return { handled: eventName || 'unknown' }
}
