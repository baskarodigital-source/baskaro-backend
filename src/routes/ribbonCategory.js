import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as ribbonCategoryController from '../controllers/ribbonCategory.controller.js'

const router = Router()

router.get('/', ribbonCategoryController.listPublic)

router.get('/all', requireAuth, requireAdmin, ribbonCategoryController.listAll)
router.post('/', requireAuth, requireAdmin, ribbonCategoryController.create)
router.patch('/:id', requireAuth, requireAdmin, ribbonCategoryController.update)
router.delete('/:id', requireAuth, requireAdmin, ribbonCategoryController.remove)

export default router
