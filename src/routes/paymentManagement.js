import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as paymentManagementController from '../controllers/paymentManagement.controller.js'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Admin-only routes
router.get('/', requireAdmin, paymentManagementController.getAllPayments)
router.post('/initiate', paymentManagementController.initiatePayment)
router.get('/order/:orderId', paymentManagementController.getPaymentByOrderId)
router.patch('/:paymentId/status', requireAdmin, paymentManagementController.updatePaymentStatus)

export default router
