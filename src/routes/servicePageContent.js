import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as servicePageContentController from '../controllers/servicePageContent.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/admin/all', requireAuth, requireAdmin, asyncHandler(servicePageContentController.listAllAdmin))
router.get('/admin/:pageKey', requireAuth, requireAdmin, asyncHandler(servicePageContentController.getAdmin))
router.put('/admin/:pageKey', requireAuth, requireAdmin, asyncHandler(servicePageContentController.upsertAdmin))
router.delete('/admin/:pageKey', requireAuth, requireAdmin, asyncHandler(servicePageContentController.removeAdmin))

router.get('/:pageKey', cachePublicJson(120), asyncHandler(servicePageContentController.getPublic))

export default router
