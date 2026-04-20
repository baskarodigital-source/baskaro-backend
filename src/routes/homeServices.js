import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as homeServiceController from '../controllers/homeService.controller.js'

const router = Router()

/** Public: active services for homepage "Our Services" */
router.get('/', homeServiceController.listPublic)

router.use(requireAuth, requireAdmin)

router.get('/admin/all', homeServiceController.listAll)
router.post('/admin', homeServiceController.create)
router.patch('/admin/:id', homeServiceController.update)
router.delete('/admin/:id', homeServiceController.remove)

export default router

