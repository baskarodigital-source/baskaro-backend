import {
  cloudinary,
  ensureCloudinaryConfigured,
  getMissingCloudinaryEnvVars,
  isCloudinaryConfigured,
  verifyCloudinaryConnection,
} from '../config/cloudinary.js'
import { normalizeUploadFolder } from '../constants/cloudinaryFolders.js'

const LOG_PREFIX = '[Cloudinary]'
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export async function getCloudinaryStatus() {
  const missing = getMissingCloudinaryEnvVars()
  if (missing.length) {
    return {
      configured: false,
      connected: false,
      cloudName: null,
      missing,
    }
  }

  const ping = await verifyCloudinaryConnection()
  return {
    configured: true,
    connected: Boolean(ping.connected),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    status: ping.status || null,
    error: ping.error || null,
  }
}

/**
 * @param {{ file: string, folder?: string, publicId?: string }} input
 * `file` — HTTPS URL, data URL, or base64 string accepted by Cloudinary upload API.
 */
export async function uploadStoreImage({ file, folder, publicId }) {
  if (!ensureCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnvVars()
    console.warn(`${LOG_PREFIX} upload skipped — missing env: ${missing.join(', ')}`)
    return {
      error:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env',
    }
  }

  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) {
    console.warn(`${LOG_PREFIX} upload rejected — invalid folder: ${folder}`)
    return { error: 'Invalid upload folder' }
  }

  const source = String(file || '').trim()
  if (!source) return { error: 'No image provided' }

  if (source.startsWith('data:')) {
    const approxBytes = Math.ceil((source.length * 3) / 4)
    if (approxBytes > MAX_UPLOAD_BYTES) {
      return { error: 'Image too large. Use a smaller file (max ~8MB).' }
    }
  }

  const options = {
    folder: normalizedFolder,
    resource_type: 'image',
    overwrite: false,
    unique_filename: true,
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  }
  if (publicId) options.public_id = String(publicId).trim()

  console.log(`${LOG_PREFIX} uploading to folder: ${normalizedFolder}`)

  try {
    const result = await cloudinary.uploader.upload(source, options)
    console.log(
      `${LOG_PREFIX} upload OK — ${result.public_id} (${result.bytes} bytes, ${result.width}x${result.height})`,
    )
    return {
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    }
  } catch (err) {
    const msg = err?.message || err?.error?.message || 'Cloudinary upload failed'
    console.error(`${LOG_PREFIX} upload FAILED — ${msg}`)
    return { error: msg }
  }
}

export async function deleteStoreImage(publicId) {
  if (!ensureCloudinaryConfigured()) {
    return { error: 'Cloudinary is not configured' }
  }
  const id = String(publicId || '').trim()
  if (!id) return { error: 'publicId is required' }
  try {
    const result = await cloudinary.uploader.destroy(id, { resource_type: 'image' })
    console.log(`${LOG_PREFIX} delete OK — ${id} (${result.result})`)
    return { ok: true, result: result.result }
  } catch (err) {
    const msg = err?.message || 'Delete failed'
    console.error(`${LOG_PREFIX} delete FAILED — ${id}: ${msg}`)
    return { error: msg }
  }
}
