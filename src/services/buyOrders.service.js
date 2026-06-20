import mongoose from 'mongoose'
import { PurchaseOrder } from '../models/PurchaseOrder.js'
import { Address } from '../models/Address.js'
import { Inventory } from '../models/Inventory.js'
import { CHECKOUT_RESERVATION_TTL_MS } from '../constants/inventoryReservation.js'
import {
  assertCartReservations,
  clearCartWithoutReleasing,
  getCartForUser,
} from './cart.service.js'
import { extendReservation } from './inventoryReservation.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

const GST_RATE = 0.12

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BUY-${ts}-${rand}`
}

async function resolveAddress(userId, body) {
  if (body?.addressId) {
    if (!mongoose.Types.ObjectId.isValid(body.addressId)) {
      throw new AppError('Invalid addressId', 400, errorCodes.BAD_REQUEST)
    }
    const addr = await Address.findOne({ _id: body.addressId, userId }).lean()
    if (!addr) throw new AppError('Address not found', 404, errorCodes.NOT_FOUND)
    return {
      label: addr.label || 'Home',
      line1: addr.line1,
      city: addr.city,
      state: addr.state || '',
      pincode: addr.pincode,
    }
  }

  const a = body?.address || {}
  if (!a.line1 || !a.city || !a.pincode) {
    throw new AppError('address.line1, address.city, and address.pincode are required', 400, errorCodes.BAD_REQUEST)
  }
  return {
    label: a.label || 'Home',
    line1: String(a.line1).trim(),
    city: String(a.city).trim(),
    state: String(a.state || '').trim(),
    pincode: String(a.pincode).trim(),
  }
}

export async function createBuyOrder(userId, body) {
  const cart = await assertCartReservations(userId)
  const address = await resolveAddress(userId, body)

  const inventoryItems = cart.items.filter((i) => i.inventoryId)
  for (const item of inventoryItems) {
    await extendReservation(item.inventoryId, userId, CHECKOUT_RESERVATION_TTL_MS)
  }

  const inventoryIds = inventoryItems.map((i) => i.inventoryId)
  const inventoryRows = inventoryIds.length
    ? await Inventory.find({ _id: { $in: inventoryIds } }).lean()
    : []
  const invById = new Map(inventoryRows.map((r) => [String(r._id), r]))

  const lineItems = cart.items.map((item) => {
    if (item.productId) {
      return {
        productId: item.productId,
        variantId: item.variantId || null,
        title: item.title,
        imageUrl: item.imageUrl,
        conditionGrade: item.conditionGrade,
        unitPriceInr: item.unitPriceInr,
        quantity: item.quantity || 1,
      }
    }

    const inv = invById.get(String(item.inventoryId))
    return {
      inventoryId: item.inventoryId,
      modelId: inv?.modelId,
      brandId: inv?.brandId,
      title: item.title,
      imageUrl: item.imageUrl,
      conditionGrade: item.conditionGrade,
      unitPriceInr: item.unitPriceInr,
      quantity: 1,
    }
  })

  const subtotalInr = lineItems.reduce((sum, i) => sum + i.unitPriceInr, 0)
  const taxInr = Math.round(subtotalInr * GST_RATE)
  const totalInr = subtotalInr + taxInr

  const order = await PurchaseOrder.create({
    userId,
    orderNumber: generateOrderNumber(),
    lineItems,
    subtotalInr,
    taxInr,
    totalInr,
    address,
    status: 'PAYMENT_PENDING',
    statusHistory: [
      { status: 'PLACED', at: new Date(), notes: 'Buy order created' },
      { status: 'PAYMENT_PENDING', at: new Date(), notes: 'Awaiting payment' },
    ],
  })

  await clearCartWithoutReleasing(userId)

  return order
}

export async function listMyBuyOrders(userId) {
  return PurchaseOrder.find({ userId }).sort({ createdAt: -1 }).lean()
}

export async function getBuyOrderForUser(userId, orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400, errorCodes.BAD_REQUEST)
  }
  const order = await PurchaseOrder.findOne({ _id: orderId, userId }).lean()
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  return order
}

export async function getBuyOrderById(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order id', 400, errorCodes.BAD_REQUEST)
  }
  const order = await PurchaseOrder.findById(orderId).lean()
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  return order
}

export async function markBuyOrderPaid(orderId, notes = 'Payment captured') {
  const order = await PurchaseOrder.findById(orderId)
  if (!order) throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  if (order.status === 'PAID' || order.status === 'CONFIRMED') return order

  order.status = 'PAID'
  order.statusHistory.push({ status: 'PAID', at: new Date(), notes })
  await order.save()
  return order
}

export async function previewBuyTotals(userId) {
  const cart = await getCartForUser(userId)
  const subtotalInr = cart.subtotalInr
  const taxInr = Math.round(subtotalInr * GST_RATE)
  return {
    subtotalInr,
    taxInr,
    totalInr: subtotalInr + taxInr,
    itemCount: cart.itemCount,
  }
}
