import { successResponse } from '../utils/helpers.js'
import { getAuthUserId } from '../middleware/auth.js'
import * as adminBuyOrdersService from '../services/adminBuyOrders.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function actorFromReq(req) {
  return {
    id: getAuthUserId(req),
    email: req.user?.email || '',
    role: req.user?.role || '',
  }
}

export async function listBuyOrders(req, res) {
  const data = await adminBuyOrdersService.listAdminBuyOrders(req.query)
  return successResponse(res, data, 'Buy orders retrieved successfully')
}

export async function getBuyOrder(req, res) {
  const order = await adminBuyOrdersService.getAdminBuyOrderById(req.params.orderId)
  return successResponse(res, order, 'Buy order retrieved successfully')
}

export async function patchBuyOrderStatus(req, res) {
  const { status, notes } = req.body || {}
  if (!status) {
    throw new AppError('Status is required', 400, errorCodes.BAD_REQUEST)
  }

  const order = await adminBuyOrdersService.updateBuyOrderStatus(
    req.params.orderId,
    status,
    notes,
    actorFromReq(req),
  )
  return successResponse(res, order, 'Buy order status updated successfully')
}
