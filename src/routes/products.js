import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as productsController from '../controllers/products.controller.js'
import {
  validate,
  idParamSchema,
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
} from '../validators/catalog.validators.js'

const router = Router()

router.get('/', validate(listProductsQuerySchema, 'query'), asyncHandler(productsController.list))
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(productsController.getById))

router.use(requireAuth, requireAdmin)
router.post('/', validate(createProductSchema), asyncHandler(productsController.create))
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateProductSchema), asyncHandler(productsController.update))
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(productsController.remove))

export default router
