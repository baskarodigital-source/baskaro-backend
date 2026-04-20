import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as bannerManagementController from '../controllers/bannerManagement.controller.js'

const router = Router()

// Public route to get active banners
router.get('/', bannerManagementController.getAllBanners)
router.get('/:bannerId', bannerManagementController.getBannerById)

// Admin-only routes
router.use(requireAuth, requireAdmin)

router.post('/', bannerManagementController.createBanner)
router.patch('/:bannerId', bannerManagementController.updateBanner)
router.delete('/:bannerId', bannerManagementController.deleteBanner)
router.patch('/:bannerId/toggle-status', bannerManagementController.toggleBannerStatus)

export default router
