import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as ctrl from '../controllers/deviceSpecifications.controller.js'

const router = Router()

// public read for model form
router.get('/:deviceId', ctrl.listByDevice)

// admin CRUD
router.post('/', requireAuth, requireAdmin, ctrl.createSpec)
router.post('/options', requireAuth, requireAdmin, ctrl.createOption)
router.patch('/:specId', requireAuth, requireAdmin, ctrl.updateSpec)
router.delete('/:specId', requireAuth, requireAdmin, ctrl.deleteSpec)
router.delete('/options/:optionId', requireAuth, requireAdmin, ctrl.deleteOption)

export default router

