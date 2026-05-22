import { Router } from 'express'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as preOwnedFeaturedController from '../controllers/preOwnedFeatured.controller.js'

const router = Router()

router.get('/featured', cachePublicJson(120), preOwnedFeaturedController.listFeatured)

export default router
