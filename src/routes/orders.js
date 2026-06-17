import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getMyOrders, payMyOrder, postMyOrder } from '../controllers/orders.controller.js'
import * as buyOrdersController from '../controllers/buyOrders.controller.js'

const router = Router()

// --- Sell orders (legacy) ---
router.post('/', requireAuth, postMyOrder)
router.get('/', requireAuth, getMyOrders)
router.patch('/:orderId/payment', requireAuth, payMyOrder)

// --- Buy orders (pre-owned checkout) ---
router.get('/preview', requireAuth, asyncHandler(buyOrdersController.previewBuyTotals))
router.post('/buy', requireAuth, asyncHandler(buyOrdersController.createBuyOrder))
router.get('/buy', requireAuth, asyncHandler(buyOrdersController.getMyBuyOrders))
router.get('/buy/:orderId', requireAuth, asyncHandler(buyOrdersController.getMyBuyOrder))

export default router

