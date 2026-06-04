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
const MAX_VIDEO_UPLOAD_BYTES = 60 * 1024 * 1024

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
const CLOUDINARY_IMAGE_STREAM_TIMEOUT_MS = 10 * 60 * 1000
const CLOUDINARY_VIDEO_STREAM_TIMEOUT_MS = 15 * 60 * 1000
const CLOUDINARY_VIDEO_CHUNK_BYTES = 6 * 1024 * 1024

function uploadStreamToCloudinary(source, options, timeoutMs = CLOUDINARY_IMAGE_STREAM_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          options.resource_type === 'video'
            ? 'Cloudinary video upload timed out. Try a shorter clip or compress the file.'
            : 'Cloudinary upload timed out. Try a smaller file.',
        ),
      )
    }, timeoutMs)

    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      clearTimeout(timeout)
      if (err) reject(err)
      else resolve(result)
    })

    uploadStream.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    if (Buffer.isBuffer(source)) {
      uploadStream.end(source)
      return
    }

    source.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
    source.pipe(uploadStream)
  })
}

/**
 * Upload raw file buffer (multipart) — avoids base64 JSON overhead.
 */
export async function uploadStoreImageFromBuffer({ buffer, folder, publicId, mimetype }) {
  if (!ensureCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnvVars()
    return {
      error:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env',
    }
  }

  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) return { error: 'Invalid upload folder' }

  if (!buffer?.length) return { error: 'No image provided' }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { error: 'Image too large. Use a smaller file (max ~8MB).' }
  }

  const options = {
    folder: normalizedFolder,
    resource_type: 'image',
    overwrite: false,
    unique_filename: true,
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  }
  if (publicId) options.public_id = String(publicId).trim()

  console.log(`${LOG_PREFIX} streaming image (${buffer.length} bytes) → ${normalizedFolder}`)

  try {
    const result = await uploadStreamToCloudinary(buffer, options)
    console.log(`${LOG_PREFIX} stream upload OK — ${result.public_id}`)
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
    console.error(`${LOG_PREFIX} stream upload FAILED — ${msg}`)
    return { error: msg }
  }
}

/**
 * Upload raw video buffer (multipart) — streams directly to Cloudinary.
 */
export async function uploadStoreVideoFromBuffer({ buffer, folder, publicId, mimetype }) {
  if (!ensureCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnvVars()
    return {
      error:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env',
    }
  }

  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) return { error: 'Invalid upload folder' }

  if (!buffer?.length) return { error: 'No video provided' }
  if (buffer.length > MAX_VIDEO_UPLOAD_BYTES) {
    return { error: 'Video too large. Use a smaller file (max ~60MB).' }
  }

  const options = {
    folder: normalizedFolder,
    resource_type: 'video',
    overwrite: false,
    unique_filename: true,
    chunk_size: CLOUDINARY_VIDEO_CHUNK_BYTES,
  }
  if (publicId) options.public_id = String(publicId).trim()

  console.log(`${LOG_PREFIX} streaming video (${buffer.length} bytes) → ${normalizedFolder}`)

  try {
    const result = await uploadStreamToCloudinary(
      buffer,
      options,
      CLOUDINARY_VIDEO_STREAM_TIMEOUT_MS,
    )
    console.log(`${LOG_PREFIX} video stream OK — ${result.public_id}`)
    return {
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      duration: result.duration,
    }
  } catch (err) {
    const msg = err?.message || err?.error?.message || 'Cloudinary video upload failed'
    console.error(`${LOG_PREFIX} video stream FAILED — ${msg}`)
    return { error: msg }
  }
}

/** Pipe multipart file stream to Cloudinary while the client is still sending bytes. */
export async function uploadStoreVideoFromStream({ stream, folder, publicId, mimetype }) {
  if (!ensureCloudinaryConfigured()) {
    return {
      error:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env',
    }
  }

  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) return { error: 'Invalid upload folder' }

  const options = {
    folder: normalizedFolder,
    resource_type: 'video',
    overwrite: false,
    unique_filename: true,
    chunk_size: CLOUDINARY_VIDEO_CHUNK_BYTES,
  }
  if (publicId) options.public_id = String(publicId).trim()

  console.log(
    `${LOG_PREFIX} piping video stream → ${normalizedFolder}${mimetype ? ` (${mimetype})` : ''}`,
  )

  try {
    const result = await uploadStreamToCloudinary(
      stream,
      options,
      CLOUDINARY_VIDEO_STREAM_TIMEOUT_MS,
    )
    console.log(`${LOG_PREFIX} video pipe OK — ${result.public_id}`)
    return {
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      duration: result.duration,
    }
  } catch (err) {
    const msg = err?.message || err?.error?.message || 'Cloudinary video upload failed'
    console.error(`${LOG_PREFIX} video pipe FAILED — ${msg}`)
    return { error: msg }
  }
}

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

/**
 * @param {{ file: string, folder?: string, publicId?: string }} input
 * `file` — HTTPS URL, data URL, or base64 string accepted by Cloudinary upload API.
 */
export async function uploadStoreVideo({ file, folder, publicId }) {
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
  if (!source) return { error: 'No video provided' }

  if (source.startsWith('data:')) {
    const approxBytes = Math.ceil((source.length * 3) / 4)
    if (approxBytes > MAX_VIDEO_UPLOAD_BYTES) {
      return { error: 'Video too large. Use a smaller file (max ~60MB).' }
    }
  }

  const options = {
    folder: normalizedFolder,
    resource_type: 'video',
    overwrite: false,
    unique_filename: true,
  }
  if (publicId) options.public_id = String(publicId).trim()

  console.log(`${LOG_PREFIX} uploading video to folder: ${normalizedFolder}`)

  try {
    const result = await cloudinary.uploader.upload(source, options)
    console.log(`${LOG_PREFIX} video upload OK — ${result.public_id} (${result.bytes} bytes)`)
    return {
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      duration: result.duration,
    }
  } catch (err) {
    const msg = err?.message || err?.error?.message || 'Cloudinary video upload failed'
    console.error(`${LOG_PREFIX} video upload FAILED — ${msg}`)
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
