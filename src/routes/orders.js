import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMyOrders, payMyOrder, postMyOrder } from '../controllers/orders.controller.js'

const router = Router()

router.post('/', requireAuth, postMyOrder)
router.get('/', requireAuth, getMyOrders)
router.patch('/:orderId/payment', requireAuth, payMyOrder)

export default router

