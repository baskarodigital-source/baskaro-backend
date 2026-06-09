import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadImageMulter, handleMulterError } from '../middleware/uploadMulter.js'
import * as uploadController from '../controllers/upload.controller.js'

const router = Router()

router.get('/status', asyncHandler(uploadController.cloudinaryStatus))

router.use((req, _res, next) => {
  if (req.method === 'POST' || req.method === 'DELETE') {
    const hasAuth = Boolean(req.headers.authorization)
    console.log(
      `[Upload] ${req.method} ${req.path} — auth: ${hasAuth ? 'present' : 'MISSING'}, content-type: ${String(req.headers['content-type'] || '').slice(0, 72)}`,
    )
  }
  next()
})

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
router.post('/video/signature', asyncHandler(uploadController.getVideoUploadSignature))
router.post('/video/file', asyncHandler(uploadController.uploadVideoMultipart))
router.delete('/image', asyncHandler(uploadController.removeImage))

export default router
