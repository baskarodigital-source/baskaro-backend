import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import {
  adminDelete,
  adminGetOrders,
  adminPatchOrderStatus,
} from '../controllers/admin.controller.js'
import { adminGetCatalog, adminUpdateVariant } from '../controllers/admin.controller.js'
import * as adminBuyOrdersController from '../controllers/adminBuyOrders.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/buy-orders', asyncHandler(adminBuyOrdersController.listBuyOrders))
router.get('/buy-orders/:orderId', asyncHandler(adminBuyOrdersController.getBuyOrder))
router.patch('/buy-orders/:orderId/status', asyncHandler(adminBuyOrdersController.patchBuyOrderStatus))

router.get('/orders', adminGetOrders)
router.patch('/orders/:orderId', adminPatchOrderStatus)
router.delete('/orders/:orderId', adminDelete)

router.get('/catalog', adminGetCatalog)
router.patch('/catalog/variants/:variantId', adminUpdateVariant)

export default router

