import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as categoriesController from '../controllers/categories.controller.js'
import {
  validate,
  idParamSchema,
  listCategoriesQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/catalog.validators.js'

const router = Router()

router.get('/', validate(listCategoriesQuerySchema, 'query'), asyncHandler(categoriesController.list))
router.get('/by-ribbon/:ribbonId', asyncHandler(categoriesController.getByRibbon))

router.use(requireAuth, requireAdmin)
router.post('/import-from-ribbon', asyncHandler(categoriesController.importFromRibbon))
router.post('/', validate(createCategorySchema), asyncHandler(categoriesController.create))
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), asyncHandler(categoriesController.update))
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(categoriesController.remove))

export default router



