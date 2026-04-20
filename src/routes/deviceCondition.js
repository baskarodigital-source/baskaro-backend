import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as deviceConditionController from '../controllers/deviceCondition.controller.js'

const router = Router()

// Public routes (can be accessed without auth for price calculation)
router.post('/calculate', deviceConditionController.calculateFinalPrice)

// Admin routes
router.get('/', requireAuth, requireAdmin, deviceConditionController.getAllDeviceConditions)
router.get('/:conditionType', deviceConditionController.getDeviceCondition)
router.post('/', requireAuth, requireAdmin, deviceConditionController.createDeviceCondition)
router.patch('/:conditionId', requireAuth, requireAdmin, deviceConditionController.updateDeviceCondition)
router.delete('/:conditionId', requireAuth, requireAdmin, deviceConditionController.deleteDeviceCondition)

export default router
