import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as pickupManagementController from '../controllers/pickupManagement.controller.js'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Admin-only routes
router.post('/', requireAdmin, pickupManagementController.schedulePickup)
router.get('/order/:orderId', pickupManagementController.getPickupByOrderId)
router.patch('/:pickupId/status', requireAdmin, pickupManagementController.updatePickupStatus)
router.patch('/:pickupId/assign-agent', requireAdmin, pickupManagementController.assignAgent)

export default router
