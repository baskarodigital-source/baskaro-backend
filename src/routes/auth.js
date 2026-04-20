import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { me, loginEmail, registerEmail, requestOtp, updateMe, verifyOtp } from '../controllers/auth.controller.js'

const router = Router()

router.post('/otp/request', requestOtp)
router.post('/otp/verify', verifyOtp)

router.post('/email/register', registerEmail)
router.post('/email/login', loginEmail)

router.get('/me', requireAuth, me)
router.patch('/me', requireAuth, updateMe)

export default router

