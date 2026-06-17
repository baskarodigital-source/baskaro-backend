import { successResponse } from '../utils/helpers.js'
import * as buyOrdersService from '../services/buyOrders.service.js'
import { getAuthUserId } from '../middleware/auth.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function requireUserId(req) {
  const userId = getAuthUserId(req)
  if (!userId) {
    throw new AppError('Unauthenticated', 401, errorCodes.AUTH_FAILED)
  }
  return userId
}

export async function createBuyOrder(req, res) {
  const userId = requireUserId(req)
  const order = await buyOrdersService.createBuyOrder(userId, req.body || {})
  return successResponse(res, order, 'Buy order created successfully', 201)
}

export async function getMyBuyOrders(req, res) {
  const userId = requireUserId(req)
  const orders = await buyOrdersService.listMyBuyOrders(userId)
  return successResponse(res, orders, 'Buy orders retrieved successfully')
}

export async function getMyBuyOrder(req, res) {
  const userId = requireUserId(req)
  const order = await buyOrdersService.getBuyOrderForUser(userId, req.params.orderId)
  return successResponse(res, order, 'Buy order retrieved successfully')
}

export async function previewBuyTotals(req, res) {
  const userId = requireUserId(req)
  const totals = await buyOrdersService.previewBuyTotals(userId)
  return successResponse(res, totals, 'Checkout totals retrieved successfully')
}
