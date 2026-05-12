import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as mobileManagementController from '../controllers/mobileManagement.controller.js'

const router = Router()

// Brand routes
router.get('/brands', asyncHandler(mobileManagementController.getAllBrands))
router.get('/brands/:brandId', asyncHandler(mobileManagementController.getBrandById))
router.post('/brands', requireAuth, requireAdmin, asyncHandler(mobileManagementController.createBrand))
router.patch('/brands/:brandId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.updateBrand))
router.delete('/brands/:brandId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.deleteBrand))

// Brand device/subcategory routes
router.get('/devices', asyncHandler(mobileManagementController.getAllBrandDevices))
router.post('/devices', requireAuth, requireAdmin, asyncHandler(mobileManagementController.createBrandDevice))
router.patch('/devices/:deviceId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.updateBrandDevice))
router.delete('/devices/:deviceId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.deleteBrandDevice))

// Phone model routes
router.get('/models', asyncHandler(mobileManagementController.getAllPhoneModels))
router.get('/models/:modelId', asyncHandler(mobileManagementController.getPhoneModelById))
router.post('/models', requireAuth, requireAdmin, asyncHandler(mobileManagementController.createPhoneModel))
router.patch('/models/:modelId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.updatePhoneModel))
router.delete('/models/:modelId', requireAuth, requireAdmin, asyncHandler(mobileManagementController.deletePhoneModel))

export default router
