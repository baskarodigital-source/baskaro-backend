import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as storeLocationsController from '../controllers/storeLocations.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/', cachePublicJson(120), asyncHandler(storeLocationsController.listPublic))

router.use(requireAuth, requireAdmin)

router.get('/admin/all', asyncHandler(storeLocationsController.listAllAdmin))
router.post('/admin', asyncHandler(storeLocationsController.createAdmin))
router.post('/admin/bulk', asyncHandler(storeLocationsController.createBulkAdmin))
router.patch('/admin/:id', asyncHandler(storeLocationsController.updateAdmin))
router.delete('/admin/:id', asyncHandler(storeLocationsController.deleteAdmin))

export default router
