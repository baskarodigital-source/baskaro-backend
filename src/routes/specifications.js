import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as specificationsController from '../controllers/specifications.controller.js'

const router = Router()

router.get('/:categoryId', asyncHandler(specificationsController.getSpecificationsByCategory))

export default router
