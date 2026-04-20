import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import * as orderManagementController from '../controllers/orderManagement.controller.js'

const router = Router()

// All routes require authentication
router.use(requireAuth)

router.post('/', orderManagementController.createOrder)
router.get('/', orderManagementController.getAllOrders)
router.get('/:orderId', orderManagementController.getOrderById)
router.patch('/:orderId/status', orderManagementController.updateOrderStatus)
router.patch('/:orderId/cancel', orderManagementController.cancelOrder)
router.post('/:orderId/apply-coupon', orderManagementController.applyCoupon)

export default router
