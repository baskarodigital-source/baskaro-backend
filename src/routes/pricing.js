import { Router } from 'express'
import { estimate } from '../controllers/pricing.controller.js'

const router = Router()

router.post('/estimate', estimate)

export default router

