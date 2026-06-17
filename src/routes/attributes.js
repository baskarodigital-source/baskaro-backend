import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as attributesController from '../controllers/attributes.controller.js'
import {
  validate,
  idParamSchema,
  listAttributesQuerySchema,
  createAttributeSchema,
  updateAttributeSchema,
} from '../validators/catalog.validators.js'

const router = Router()

router.get('/', validate(listAttributesQuerySchema, 'query'), asyncHandler(attributesController.list))

router.use(requireAuth, requireAdmin)
router.post('/', validate(createAttributeSchema), asyncHandler(attributesController.create))
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateAttributeSchema), asyncHandler(attributesController.update))
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(attributesController.remove))

export default router
