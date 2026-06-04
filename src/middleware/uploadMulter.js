import multer from 'multer'

const storage = multer.memoryStorage()

function imageFilter(_req, file, cb) {
  const mimeOk = /^image\/(jpeg|png|webp)$/i.test(file.mimetype || '')
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.originalname || '')
  cb(null, mimeOk || extOk)
}

function videoFilter(_req, file, cb) {
  const mimeOk = /^video\/(mp4|quicktime|webm)$/i.test(file.mimetype || '')
  const extOk = /\.(mp4|mov|webm)$/i.test(file.originalname || '')
  cb(null, mimeOk || extOk)
}

export const uploadImageMulter = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: imageFilter,
}).single('file')

export const uploadVideoMulter = multer({
  storage,
  limits: { fileSize: 55 * 1024 * 1024, files: 1 },
  fileFilter: videoFilter,
}).single('file')

export function handleMulterError(err, _req, res, next) {
  if (!err) return next()
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: err.field === 'file' && String(_req.path || '').includes('video')
        ? 'Video is too large. Use a file under 50MB or compress it before uploading.'
        : 'Image is too large. Use a smaller file (max ~8MB).',
    })
  }
  if (err.message === 'Unexpected field') {
    return res.status(400).json({ error: 'Invalid upload field. Use "file".' })
  }
  return res.status(400).json({ error: err.message || 'Upload failed' })
}
