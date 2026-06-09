import multer from 'multer'

const storage = multer.memoryStorage()

function imageFilter(_req, file, cb) {
  const mime = file.mimetype || ''
  const name = file.originalname || ''
  const mimeOk = /^image\/(jpeg|png|webp|gif|bmp)$/i.test(mime) || /^image\//i.test(mime)
  const extOk = /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)
  // Windows often sends application/octet-stream or empty MIME for extensionless files — validate buffer in controller.
  const genericOk = !mime || mime === 'application/octet-stream'
  const ok = mimeOk || extOk || genericOk
  if (!ok) {
    console.warn(`[Upload] multer rejected image — mimetype: ${mime || '(empty)'}, name: ${name || '(empty)'}`)
  }
  cb(null, ok)
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

export function handleMulterError(err, req, res, next) {
  if (!err) return next()
  console.warn(`[Upload] multer error on ${req.method} ${req.path}: ${err.message || err.code || err}`)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: err.field === 'file' && String(req.path || '').includes('video')
        ? 'Video is too large. Use a file under 50MB or compress it before uploading.'
        : 'Image is too large. Use a smaller file (max ~8MB).',
    })
  }
  if (err.message === 'Unexpected field') {
    return res.status(400).json({ error: 'Invalid upload field. Use "file".' })
  }
  return res.status(400).json({ error: err.message || 'Upload failed' })
}
