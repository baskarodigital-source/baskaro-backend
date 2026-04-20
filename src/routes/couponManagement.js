import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as couponManagementController from '../controllers/couponManagement.controller.js'

const router = Router()

// Public route to get coupon by code (for applying at checkout)
router.get('/code/:code', couponManagementController.getCouponByCode)

// All other routes require admin authentication
router.use(requireAuth, requireAdmin)

router.get('/', couponManagementController.getAllCoupons)
router.get('/:couponId', couponManagementController.getCouponById)
router.post('/', couponManagementController.createCoupon)
router.patch('/:couponId', couponManagementController.updateCoupon)
router.patch('/:couponId/disable', couponManagementController.disableCoupon)
router.delete('/:couponId', couponManagementController.deleteCoupon)

export default router
