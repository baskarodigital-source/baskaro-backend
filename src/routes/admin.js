import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import {
  adminDelete,
  adminGetOrders,
  adminPatchOrderStatus,
} from '../controllers/admin.controller.js'
import { adminGetCatalog, adminUpdateVariant } from '../controllers/admin.controller.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/orders', adminGetOrders)
router.patch('/orders/:orderId', adminPatchOrderStatus)
router.delete('/orders/:orderId', adminDelete)

router.get('/catalog', adminGetCatalog)
router.patch('/catalog/variants/:variantId', adminUpdateVariant)

export default router

