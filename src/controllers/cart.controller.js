import { successResponse } from '../utils/helpers.js'
import * as cartService from '../services/cart.service.js'
import { getAuthUserId } from '../middleware/auth.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function requireUserId(req) {
  const userId = getAuthUserId(req)
  if (!userId) {
    throw new AppError('Unauthenticated', 401, errorCodes.AUTH_FAILED)
  }
  return userId
}

export async function getCart(req, res) {
  const userId = requireUserId(req)
  const data = await cartService.getCartForUser(userId)
  return successResponse(res, data, 'Cart retrieved successfully')
}

export async function addCartItem(req, res) {
  const userId = requireUserId(req)
  const { inventoryId, productId, variantId } = req.body || {}

  if (productId) {
    const data = await cartService.addCatalogProductToCart(userId, productId, variantId)
    return successResponse(res, data, 'Item added to cart', 201)
  }

  if (!inventoryId) {
    return res.status(400).json({
      success: false,
      message: 'inventoryId or productId is required',
      code: 'BAD_REQUEST',
    })
  }

  const data = await cartService.addInventoryToCart(userId, inventoryId)
  return successResponse(res, data, 'Item added to cart', 201)
}

export async function removeCartItem(req, res) {
  const userId = requireUserId(req)
  const { inventoryId } = req.params
  const data = await cartService.removeInventoryFromCart(userId, inventoryId)
  return successResponse(res, data, 'Item removed from cart')
}

export async function clearCart(req, res) {
  const userId = requireUserId(req)
  const data = await cartService.clearCartForUser(userId)
  return successResponse(res, data, 'Cart cleared')
}
