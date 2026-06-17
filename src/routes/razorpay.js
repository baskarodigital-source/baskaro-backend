import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as razorpayController from '../controllers/razorpay.controller.js'

const router = Router()

router.get('/config', asyncHandler(razorpayController.getRazorpayConfig))
router.post('/create-order', requireAuth, asyncHandler(razorpayController.createRazorpayOrder))
router.post('/verify', requireAuth, asyncHandler(razorpayController.verifyRazorpayPayment))
router.post('/mock-complete', requireAuth, asyncHandler(razorpayController.mockPayOrder))

export default router
