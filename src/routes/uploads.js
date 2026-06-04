import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadImageMulter, handleMulterError } from '../middleware/uploadMulter.js'
import * as uploadController from '../controllers/upload.controller.js'

const router = Router()

router.get('/status', asyncHandler(uploadController.cloudinaryStatus))

router.use(requireAuth, requireAdmin)

router.get('/ping', asyncHandler(uploadController.cloudinaryPing))

router.post('/image', asyncHandler(uploadController.uploadImage))
router.post('/video', asyncHandler(uploadController.uploadVideo))
router.post(
  '/image/file',
  (req, res, next) => {
    uploadImageMulter(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next)
      next()
    })
  },
  asyncHandler(uploadController.uploadImageMultipart),
)
router.post('/video/file', asyncHandler(uploadController.uploadVideoMultipart))
router.delete('/image', asyncHandler(uploadController.removeImage))

export default router
