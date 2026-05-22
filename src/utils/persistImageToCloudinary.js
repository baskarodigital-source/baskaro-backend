import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'
import { uploadStoreImage } from '../services/cloudinary.service.js'
import { AppError, errorCodes } from './errorHandler.js'

const LOG_PREFIX = '[Cloudinary]'

export function isCloudinaryUrl(url) {
  return /res\.cloudinary\.com/i.test(String(url || ''))
}

function toUploadSource(raw) {
  const t = String(raw ?? '').trim()
  if (!t || isCloudinaryUrl(t)) return null
  if (t.startsWith('data:') || /^https?:\/\//i.test(t)) return t
  if (t.startsWith('/')) {
    const base =
      process.env.PUBLIC_API_URL ||
      process.env.API_BASE_URL ||
      `http://127.0.0.1:${process.env.PORT || 4000}`
    return `${String(base).replace(/\/$/, '')}${t}`
  }
  return t
}

/**
 * Store any image reference in Cloudinary (data URL, remote URL, or /hero path).
 * Already-Cloudinary URLs are returned unchanged.
 */
export async function persistImageToCloudinary(raw, folder = CLOUDINARY_FOLDERS.general) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  if (isCloudinaryUrl(t)) return t

  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      503,
      errorCodes.BAD_REQUEST,
    )
  }

  const source = toUploadSource(t)
  if (!source) return t

  const result = await uploadStoreImage({ file: source, folder })
  if (result.error) {
    console.error(`${LOG_PREFIX} persist failed (${folder}): ${result.error}`)
    throw new AppError(result.error, 400, errorCodes.BAD_REQUEST)
  }

  console.log(`${LOG_PREFIX} persisted image → ${result.publicId}`)
  return result.url
}

export async function persistImagesArray(images, folder = CLOUDINARY_FOLDERS.inventory) {
  if (!Array.isArray(images)) return []
  const out = []
  for (const img of images) {
    const url = await persistImageToCloudinary(img, folder)
    if (url) out.push(url)
  }
  return out
}

/** Normalize common body fields before Mongo write */
export async function persistImageFields(body, fieldMap) {
  if (!body || typeof body !== 'object') return body
  const next = { ...body }
  for (const [field, folder] of Object.entries(fieldMap)) {
    if (next[field] != null && String(next[field]).trim()) {
      next[field] = await persistImageToCloudinary(next[field], folder)
    }
  }
  return next
}
