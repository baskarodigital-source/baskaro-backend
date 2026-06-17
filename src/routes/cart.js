import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as cartController from '../controllers/cart.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(cartController.getCart))
router.post('/items', asyncHandler(cartController.addCartItem))
router.delete('/items/:inventoryId', asyncHandler(cartController.removeCartItem))
router.delete('/', asyncHandler(cartController.clearCart))

export default router
