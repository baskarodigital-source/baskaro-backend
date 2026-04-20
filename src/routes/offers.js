import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as offerController from '../controllers/offer.controller.js'

const router = Router()

// Public: active offers (optionally filtered by modelId; includes global offers)
router.get('/', offerController.listPublic)

// Admin CRUD
router.use(requireAuth, requireAdmin)
router.get('/admin/all', offerController.listAll)
router.get('/admin/:id', offerController.getById)
router.post('/admin', offerController.create)
router.patch('/admin/:id', offerController.update)
router.delete('/admin/:id', offerController.remove)

export default router

