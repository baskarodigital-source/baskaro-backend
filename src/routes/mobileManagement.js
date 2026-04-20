import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as mobileManagementController from '../controllers/mobileManagement.controller.js'

const router = Router()

// Brand routes
router.get('/brands', mobileManagementController.getAllBrands)
router.get('/brands/:brandId', mobileManagementController.getBrandById)
router.post('/brands', requireAuth, requireAdmin, mobileManagementController.createBrand)
router.patch('/brands/:brandId', requireAuth, requireAdmin, mobileManagementController.updateBrand)
router.delete('/brands/:brandId', requireAuth, requireAdmin, mobileManagementController.deleteBrand)

// Brand device/subcategory routes
router.get('/devices', mobileManagementController.getAllBrandDevices)
router.post('/devices', requireAuth, requireAdmin, mobileManagementController.createBrandDevice)
router.patch('/devices/:deviceId', requireAuth, requireAdmin, mobileManagementController.updateBrandDevice)
router.delete('/devices/:deviceId', requireAuth, requireAdmin, mobileManagementController.deleteBrandDevice)

// Phone model routes
router.get('/models', mobileManagementController.getAllPhoneModels)
router.get('/models/:modelId', mobileManagementController.getPhoneModelById)
router.post('/models', requireAuth, requireAdmin, mobileManagementController.createPhoneModel)
router.patch('/models/:modelId', requireAuth, requireAdmin, mobileManagementController.updatePhoneModel)
router.delete('/models/:modelId', requireAuth, requireAdmin, mobileManagementController.deletePhoneModel)

export default router
