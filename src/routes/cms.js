import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as cmsController from '../controllers/cms.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/pages', cachePublicJson(120), asyncHandler(cmsController.listPublic))
router.get('/pages/:slug', cachePublicJson(120), asyncHandler(cmsController.getPublicBySlug))

router.use(requireAuth, requireAdmin)

router.get('/admin/pages/by-slug/:slug', asyncHandler(cmsController.getAdminBySlug))
router.get('/admin/pages', asyncHandler(cmsController.listAllAdmin))
router.post('/admin/pages', asyncHandler(cmsController.createAdmin))
router.patch('/admin/pages/:id', asyncHandler(cmsController.updateAdmin))
router.delete('/admin/pages/:id', asyncHandler(cmsController.deleteAdmin))

export default router
