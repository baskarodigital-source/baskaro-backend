import mongoose from 'mongoose'
import { PurchaseOrder, PURCHASE_ORDER_STATUS_VALUES } from '../models/PurchaseOrder.js'
import { BuyPayment } from '../models/BuyPayment.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { formatPaginationResponse, getPagination } from '../utils/helpers.js'

const STATUS_RANK = new Map(
  ['PLACED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s, i) => [s, i]),
)

function assertValidStatus(status) {
  if (!PURCHASE_ORDER_STATUS_VALUES.includes(status)) {
    throw new AppError('Invalid order status', 400, errorCodes.BAD_REQUEST)
  }
}

function assertAdminTransition(current, next) {
  if (current === next) return
  assertValidStatus(next)

  if (next === 'CANCELLED') {
    if (current === 'DELIVERED') {
      throw new AppError('Delivered orders cannot be cancelled', 400, errorCodes.BAD_REQUEST)
    }
    return
  }

  const curRank = STATUS_RANK.get(current) ?? -1
  const nextRank = STATUS_RANK.get(next) ?? -1
  if (nextRank <= curRank) {
    throw new AppError(`Cannot move order from ${current} to ${next}`, 400, errorCodes.BAD_REQUEST)
  }
}

export async function listAdminBuyOrders({
  page = 1,
  limit = 20,
  status = '',
  startDate = '',
  endDate = '',
} = {}) {
  const { skip } = getPagination(page, limit)
  const query = {}

  if (status && PURCHASE_ORDER_STATUS_VALUES.includes(status)) {
    query.status = status
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments(query),
  ])

  const orderIds = orders.map((o) => o._id)
  const payments = orderIds.length
    ? await BuyPayment.find({ purchaseOrderId: { $in: orderIds } })
        .select('purchaseOrderId status paidAt gatewayResponse')
        .lean()
    : []
  const paymentByOrderId = new Map(payments.map((p) => [String(p.purchaseOrderId), p]))

  const itemsWithPayment = orders.map((order) => {
    const p = paymentByOrderId.get(String(order._id))
    return {
      ...order,
      payment: p
        ? {
            status: p.status,
            paidAt: p.paidAt || null,
            notification: p.gatewayResponse?.notification || null,
          }
        : null,
    }
  })

  return formatPaginationResponse(itemsWithPayment, total, page, limit)
}

export async function getAdminBuyOrderById(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400, errorCodes.BAD_REQUEST)
  }

  const order = await PurchaseOrder.findById(orderId)
    .populate('userId', 'name email phone')
    .lean()

  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  const payment = await BuyPayment.findOne({ purchaseOrderId: order._id })
    .select('status paidAt gatewayResponse')
    .lean()

  return {
    ...order,
    payment: payment
      ? {
          status: payment.status,
          paidAt: payment.paidAt || null,
          notification: payment.gatewayResponse?.notification || null,
        }
      : null,
  }
}

export async function updateBuyOrderStatus(orderId, status, notes = '', actor = {}) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400, errorCodes.BAD_REQUEST)
  }

  assertValidStatus(status)

  const order = await PurchaseOrder.findById(orderId)
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)

  assertAdminTransition(order.status, status)

  const actorLabel = actor.email || actor.role || actor.id || 'admin'
  const noteText = String(notes || '').trim()
  const historyNote = noteText
    ? `${noteText} (by ${actorLabel})`
    : `Status updated to ${status} by ${actorLabel}`

  order.status = status
  order.statusHistory.push({ status, at: new Date(), notes: historyNote })
  await order.save()

  return order.populate('userId', 'name email phone')
}
