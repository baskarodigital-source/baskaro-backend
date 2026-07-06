import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as sellNavController from '../controllers/sellNav.controller.js'

const router = Router()

router.get('/mega-menu', cachePublicJson(120), asyncHandler(sellNavController.getMegaMenu))

export default router
