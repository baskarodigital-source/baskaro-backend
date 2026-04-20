import { Order, ORDER_STATUS_VALUES } from '../models/Order.js'
import { estimateSellingPrice } from './pricing.service.js'

export async function createSellOrder(userId, payload) {
  const {
    brand,
    model,
    ram,
    storage,
    screen,
    body,
    battery,
    accessories,
    pickupDate,
    pickupTime,
    address,
    payMethod,
  } = payload || {}

  if (!brand || !model || !ram || !storage) return { error: 'brand, model, ram, storage are required.' }
  if (!pickupDate || !pickupTime) return { error: 'pickupDate and pickupTime are required.' }
  if (!address?.line1 || !address?.city || !address?.pincode) return { error: 'address.line1/city/pincode are required.' }
  if (!payMethod) return { error: 'payMethod is required.' }

  const estimate = await estimateSellingPrice({
    brand,
    model,
    ram,
    storage,
    screenCondition: screen,
    bodyCondition: body,
    batteryHealth: battery,
    accessories,
  })

  const breakdown = estimate.breakdown || {}
  const order = await Order.create({
    userId,
    brand,
    model,
    ram,
    storage,
    basePriceInr: breakdown.basePrice ?? 0,
    estimateInr: estimate.finalPrice ?? 0,
    deductionPct: breakdown.totalDeductionPct ?? 0,

    screen,
    body,
    battery,
    accessories,

    pickupDate,
    pickupTime,
    address: {
      label: address.label || 'Home',
      line1: address.line1,
      city: address.city,
      state: address.state || '',
      pincode: address.pincode,
    },

    payMethod,
    paymentDetails: {},

    status: 'Request Submitted',
    statusHistory: [{ status: 'Request Submitted', at: new Date() }],
  })

  return { ok: true, order: order.toObject ? order.toObject() : order }
}

export async function listMyOrders(userId) {
  return Order.find({ userId }).sort({ createdAt: -1 }).lean()
}

export async function payOrderAsUser(userId, orderId, { payMethod, paymentDetails }) {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) return { error: 'Order not found.' }

  order.payMethod = payMethod || order.payMethod
  order.paymentDetails = paymentDetails || {}

  // In the frontend: user pays only after admin moves to "Device Received".
  order.status = 'Payment Completed'
  order.statusHistory = order.statusHistory || []
  order.statusHistory.push({ status: 'Payment Completed', at: new Date() })

  await order.save()
  return { ok: true, order: order.toObject() }
}

export async function listAllOrders({ status } = {}) {
  const filter = {}
  if (status && ORDER_STATUS_VALUES.includes(status)) filter.status = status
  return Order.find(filter).sort({ createdAt: -1 }).lean()
}

export async function adminUpdateOrderStatus(orderId, newStatus) {
  if (!ORDER_STATUS_VALUES.includes(newStatus)) return { error: 'Invalid status.' }
  const order = await Order.findById(orderId)
  if (!order) return { error: 'Order not found.' }

  order.status = newStatus
  order.statusHistory = order.statusHistory || []
  order.statusHistory.push({ status: newStatus, at: new Date() })
  await order.save()
  return { ok: true, order: order.toObject() }
}

export async function adminDeleteOrder(orderId) {
  const existing = await Order.findById(orderId).lean()
  if (!existing) return { error: 'Order not found.' }
  await Order.deleteOne({ _id: orderId })
  return { ok: true }
}

