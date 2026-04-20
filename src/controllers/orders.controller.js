import {
  adminDeleteOrder,
  adminUpdateOrderStatus,
  createSellOrder,
  listAllOrders,
  listMyOrders,
  payOrderAsUser,
} from '../services/orders.service.js'
import mongoose from 'mongoose'

export async function postMyOrder(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

  const result = await createSellOrder(userId, req.body || {})
  if (result.error) return res.status(400).json(result)
  return res.status(201).json(result.order)
}

export async function getMyOrders(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
  const orders = await listMyOrders(userId)
  return res.json(orders)
}

export async function payMyOrder(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

  const { orderId } = req.params
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: 'orderId must be a valid ObjectId' })
  }

  const result = await payOrderAsUser(userId, orderId, {
    payMethod: req.body?.payMethod,
    paymentDetails: req.body?.paymentDetails,
  })

  if (result.error) return res.status(400).json(result)
  return res.json(result.order)
}

// Admin endpoints
export async function adminGetOrders(req, res) {
  const orders = await listAllOrders({ status: req.query.status })
  return res.json(orders)
}

export async function adminPatchOrderStatus(req, res) {
  const { orderId } = req.params
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: 'orderId must be a valid ObjectId' })
  }

  const result = await adminUpdateOrderStatus(orderId, req.body?.status)
  if (result.error) return res.status(400).json(result)
  return res.json(result.order)
}

export async function adminDelete(req, res) {
  const { orderId } = req.params
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: 'orderId must be a valid ObjectId' })
  }

  const result = await adminDeleteOrder(orderId)
  if (result.error) return res.status(400).json(result)
  return res.json({ ok: true })
}

