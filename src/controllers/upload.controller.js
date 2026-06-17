import Busboy from 'busboy'
import { cloudinary, logCloudinaryStatus, ensureCloudinaryConfigured } from '../config/cloudinary.js'
import {
  getCloudinaryStatus,
  uploadStoreImage,
  uploadStoreVideo,
  uploadStoreImageFromBuffer,
  uploadStoreVideoFromStream,
  deleteStoreImage,
} from '../services/cloudinary.service.js'
import { CLOUDINARY_FOLDERS, normalizeUploadFolder } from '../constants/cloudinaryFolders.js'
import { isImageBuffer, sniffImageMimeFromBuffer } from '../utils/imageBufferProbe.js'

const VIDEO_UPLOAD_SOCKET_MS = 15 * 60 * 1000

function extendUploadSocketTimeout(req) {
  req.setTimeout(VIDEO_UPLOAD_SOCKET_MS)
  if (req.socket?.setTimeout) req.socket.setTimeout(VIDEO_UPLOAD_SOCKET_MS)
}

function isVideoMultipartFile(mime, filename) {
  const mimeOk = /^video\/(mp4|quicktime|webm)$/i.test(mime || '')
  const extOk = /\.(mp4|mov|webm)$/i.test(filename || '')
  return mimeOk || extOk
}

function resolveUploadErrorStatus(message, fallback = 400) {
  const msg = String(message || '').toLowerCase()
  if (!msg) return fallback
  if (msg.includes('not configured')) return 503
  if (msg.includes('too large')) return 413
  return fallback
}

function parseVideoMultipartStream(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 55 * 1024 * 1024, files: 1 },
    })

    let folder = CLOUDINARY_FOLDERS.videos
    let publicId
    let uploadPromise = null
    let settled = false
    let fileReceived = false

    const finishResolve = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const finishReject = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    bb.on('field', (name, val) => {
      if (name === 'folder') folder = val
      if (name === 'publicId') publicId = val
    })

    bb.on('file', (fieldname, stream, info) => {
      if (fieldname !== 'file') {
        stream.resume()
        return
      }
      if (uploadPromise) {
        stream.resume()
        return
      }

      fileReceived = true
      const mime = info.mimeType || ''
      if (!isVideoMultipartFile(mime, info.filename)) {
        stream.resume()
        finishReject(new Error('Invalid video format. Use MP4, MOV, or WEBM.'))
        return
      }

      stream.on('limit', () => {
        finishReject(new Error('Video is too large. Use a file under 50MB or compress it before uploading.'))
      })

      const normalizedFolder = normalizeUploadFolder(folder || CLOUDINARY_FOLDERS.videos)
      if (!normalizedFolder) {
        stream.resume()
        finishReject(new Error('Invalid upload folder'))
        return
      }

      uploadPromise = uploadStoreVideoFromStream({
        stream,
        folder: normalizedFolder,
        publicId,
        mimetype: mime,
      })
    })

    bb.on('error', finishReject)

    bb.on('close', async () => {
      try {
        if (!fileReceived || !uploadPromise) {
          finishReject(new Error('No video file provided. Use field name "file".'))
          return
        }
        finishResolve(await uploadPromise)
      } catch (err) {
        finishReject(err)
      }
    })

    req.pipe(bb)
  })
}

export async function cloudinaryStatus(_req, res) {
  const status = await getCloudinaryStatus()
  console.log(
    `[Cloudinary] status check -> configured: ${status.configured}, connected: ${status.connected}${
      status.cloudName ? `, cloud: ${status.cloudName}` : ''
    }${status.error ? `, error: ${status.error}` : ''}`,
  )
  return res.json(status)
}

/** Admin: re-run ping and log result (useful when debugging .env). */
export async function cloudinaryPing(_req, res) {
  const result = await logCloudinaryStatus({ ping: true })
  return res.json(result)
}

export async function uploadImage(req, res) {
  const { file, folder, publicId } = req.body || {}
  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) {
    return res.status(400).json({ error: 'Invalid upload folder' })
  }

  const result = await uploadStoreImage({ file, folder: normalizedFolder, publicId })
  if (result.error) {
    return res.status(resolveUploadErrorStatus(result.error)).json({ error: result.error })
  }
  return res.status(201).json(result)
}

export async function uploadVideo(req, res) {
  const { file, folder = CLOUDINARY_FOLDERS.videos, publicId } = req.body || {}
  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) {
    return res.status(400).json({ error: 'Invalid upload folder' })
  }

  const result = await uploadStoreVideo({ file, folder: normalizedFolder, publicId })
  if (result.error) {
    return res.status(resolveUploadErrorStatus(result.error)).json({ error: result.error })
  }
  return res.status(201).json(result)
}

/** Multipart image -> binary stream to Cloudinary (fast, no base64 JSON). */
export async function uploadImageMultipart(req, res) {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ error: 'No image file provided. Use field name "file".' })
  }
  if (!isImageBuffer(req.file.buffer)) {
    console.warn(
      `[Upload] image/file rejected -> not a valid image buffer (mimetype: ${req.file.mimetype || 'unknown'}, name: ${req.file.originalname || 'unknown'})`,
    )
    return res.status(400).json({
      error: 'Invalid image file. Use JPG, PNG, or WEBP (rename with .jpg/.png if Windows hides the extension).',
    })
  }

  const folder = req.body?.folder
  const normalizedFolder = normalizeUploadFolder(folder)
  if (!normalizedFolder) {
    return res.status(400).json({ error: 'Invalid upload folder' })
  }

  const publicId = req.body?.publicId
  const sniffedMime = sniffImageMimeFromBuffer(req.file.buffer)
  console.log(
    `[Upload] POST /image/file -> ${req.file.buffer.length} bytes, folder: ${normalizedFolder}, mimetype: ${req.file.mimetype || sniffedMime || 'unknown'}`,
  )

  const result = await uploadStoreImageFromBuffer({
    buffer: req.file.buffer,
    folder: normalizedFolder,
    publicId,
    mimetype: sniffedMime || req.file.mimetype,
  })

  if (result.error) {
    console.warn(`[Upload] image/file failed: ${result.error}`)
    return res.status(resolveUploadErrorStatus(result.error)).json({ error: result.error })
  }

  console.log(`[Upload] image/file OK -> ${result.url || result.secure_url || '(no url)'}`)
  return res.status(201).json(result)
}

/** Multipart video -> pipe upload stream to Cloudinary (no full-file RAM buffer). */
export async function uploadVideoMultipart(req, res) {
  extendUploadSocketTimeout(req)

  const contentType = String(req.headers['content-type'] || '')
  if (!contentType.includes('multipart/form-data')) {
    return res.status(415).json({ error: 'Expected multipart/form-data upload.' })
  }

  let result
  try {
    result = await parseVideoMultipartStream(req)
  } catch (err) {
    const msg = err?.message || 'Video upload failed'
    return res.status(resolveUploadErrorStatus(msg, 400)).json({ error: msg })
  }

  if (result.error) {
    return res.status(resolveUploadErrorStatus(result.error)).json({ error: result.error })
  }
  return res.status(201).json(result)
}

/** Signed params so the browser can upload video directly to Cloudinary (bypasses nginx body limits on api.baskaro.com). */
export async function getVideoUploadSignature(req, res) {
  if (!ensureCloudinaryConfigured()) {
    return res.status(503).json({
      error:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env',
    })
  }

  const folder = normalizeUploadFolder(req.body?.folder || CLOUDINARY_FOLDERS.videos)
  if (!folder) return res.status(400).json({ error: 'Invalid upload folder' })

  const timestamp = Math.round(Date.now() / 1000)
  // Sign only fields sent in the upload body. Do not include chunk_size - that
  // enables Cloudinary's multi-request chunked protocol (Content-Range), which
  // a single browser XHR cannot satisfy and stalls around ~5-10%.
  const paramsToSign = { timestamp, folder }
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  )

  return res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
  })
}

export async function removeImage(req, res) {
  const { publicId } = req.body || {}
  if (!String(publicId || '').trim()) {
    return res.status(400).json({ error: 'publicId is required' })
  }

  const result = await deleteStoreImage(publicId)
  if (result.error) {
    return res.status(resolveUploadErrorStatus(result.error)).json({ error: result.error })
  }
  return res.json(result)
}
