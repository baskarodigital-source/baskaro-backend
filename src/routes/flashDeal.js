import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { cachePublicJson } from '../middleware/cachePublic.js'
import * as flashDealController from '../controllers/flashDeal.controller.js'

const router = Router()

/** Public: active deals for homepage carousel */
router.get('/', cachePublicJson(120), flashDealController.listPublic)
router.get('/section', cachePublicJson(120), flashDealController.getSection)

router.use(requireAuth, requireAdmin)

router.patch('/admin/section', flashDealController.upsertSection)
router.get('/admin/all', flashDealController.listAll)
router.get('/admin/:id', flashDealController.getById)
router.post('/admin', flashDealController.create)
router.patch('/admin/:id', flashDealController.update)
router.delete('/admin/:id', flashDealController.remove)

export default router
