import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as uploadController from '../controllers/upload.controller.js'

const router = Router()

router.get('/status', asyncHandler(uploadController.cloudinaryStatus))

router.use(requireAuth, requireAdmin)

router.get('/ping', asyncHandler(uploadController.cloudinaryPing))

router.post('/image', asyncHandler(uploadController.uploadImage))
router.delete('/image', asyncHandler(uploadController.removeImage))

export default router
