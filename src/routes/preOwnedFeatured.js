import { Router } from 'express'
import * as preOwnedFeaturedController from '../controllers/preOwnedFeatured.controller.js'

const router = Router()

router.get('/featured', preOwnedFeaturedController.listFeatured)

export default router
