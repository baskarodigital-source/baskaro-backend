import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'
import { uploadStoreImage, uploadStoreVideo } from '../services/cloudinary.service.js'
import { AppError, errorCodes } from './errorHandler.js'

const LOG_PREFIX = '[Cloudinary]'

export function isCloudinaryUrl(url) {
  return /res\.cloudinary\.com/i.test(String(url || ''))
}

function toUploadSource(raw) {
  const t = String(raw ?? '').trim()
  if (!t || isCloudinaryUrl(t)) return null
  if (t.startsWith('blob:')) return null
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
  if (!source) {
    if (String(raw ?? '').trim().startsWith('blob:')) {
      throw new AppError(
        'Media was not uploaded to Cloudinary. Wait for uploads to finish before saving.',
        400,
        errorCodes.BAD_REQUEST,
      )
    }
    return t
  }

  const result = await uploadStoreImage({ file: source, folder })
  if (result.error) {
    console.error(`${LOG_PREFIX} persist failed (${folder}): ${result.error}`)
    throw new AppError(result.error, 400, errorCodes.BAD_REQUEST)
  }

  console.log(`${LOG_PREFIX} persisted image → ${result.publicId}`)
  return result.url
}

/**
 * Store any video reference in Cloudinary (data URL or remote URL).
 * Already-Cloudinary URLs are returned unchanged.
 */
export async function persistVideoToCloudinary(raw, folder = CLOUDINARY_FOLDERS.videos) {
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
  if (!source) {
    if (String(raw ?? '').trim().startsWith('blob:')) {
      throw new AppError(
        'Video was not uploaded to Cloudinary. Wait for the upload to finish before saving.',
        400,
        errorCodes.BAD_REQUEST,
      )
    }
    return t
  }

  const result = await uploadStoreVideo({ file: source, folder })
  if (result.error) {
    console.error(`${LOG_PREFIX} persist video failed (${folder}): ${result.error}`)
    throw new AppError(result.error, 400, errorCodes.BAD_REQUEST)
  }

  console.log(`${LOG_PREFIX} persisted video → ${result.publicId}`)
  return result.url
}

export async function persistImagesArray(images, folder = CLOUDINARY_FOLDERS.inventory) {
  if (!Array.isArray(images)) return []
  const urls = await Promise.all(
    images.map((img) => persistImageToCloudinary(img, folder)),
  )
  return urls.filter(Boolean)
}

export async function persistVideosArray(videos, folder = CLOUDINARY_FOLDERS.videos) {
  if (!Array.isArray(videos)) return []
  const urls = await Promise.all(
    videos.map((vid) => persistVideoToCloudinary(vid, folder)),
  )
  return urls.filter(Boolean)
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
