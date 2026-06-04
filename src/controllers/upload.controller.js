import Busboy from 'busboy'
import { logCloudinaryStatus } from '../config/cloudinary.js'
import {
  getCloudinaryStatus,
  uploadStoreImage,
  uploadStoreVideo,
  uploadStoreImageFromBuffer,
  uploadStoreVideoFromStream,
  deleteStoreImage,
} from '../services/cloudinary.service.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'

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

function parseVideoMultipartStream(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 55 * 1024 * 1024, files: 1 },
    })

    let folder = CLOUDINARY_FOLDERS.videos
    let publicId
    let uploadPromise = null

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

      const mime = info.mimeType || ''
      if (!isVideoMultipartFile(mime, info.filename)) {
        stream.resume()
        reject(new Error('Invalid video format. Use MP4, MOV, or WEBM.'))
        return
      }

      uploadPromise = uploadStoreVideoFromStream({
        stream,
        folder,
        publicId,
        mimetype: mime,
      })
    })

    bb.on('error', reject)

    bb.on('close', async () => {
      try {
        if (!uploadPromise) {
          reject(new Error('No video file provided. Use field name "file".'))
          return
        }
        resolve(await uploadPromise)
      } catch (err) {
        reject(err)
      }
    })

    req.pipe(bb)
  })
}

export async function cloudinaryStatus(_req, res) {
  const status = await getCloudinaryStatus()
  console.log(
    `[Cloudinary] status check — configured: ${status.configured}, connected: ${status.connected}${
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
  const result = await uploadStoreImage({ file, folder, publicId })
  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.status(201).json(result)
}

export async function uploadVideo(req, res) {
  const { file, folder = CLOUDINARY_FOLDERS.videos, publicId } = req.body || {}
  const result = await uploadStoreVideo({ file, folder, publicId })
  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.status(201).json(result)
}

/** Multipart image — binary stream to Cloudinary (fast, no base64 JSON). */
export async function uploadImageMultipart(req, res) {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ error: 'No image file provided. Use field name "file".' })
  }
  const folder = req.body?.folder
  const publicId = req.body?.publicId
  const result = await uploadStoreImageFromBuffer({
    buffer: req.file.buffer,
    folder,
    publicId,
    mimetype: req.file.mimetype,
  })
  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.status(201).json(result)
}

/** Multipart video — pipe upload stream to Cloudinary (no full-file RAM buffer). */
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
    const status = /too large/i.test(msg) ? 413 : 400
    return res.status(status).json({ error: msg })
  }

  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.status(201).json(result)
}

export async function removeImage(req, res) {
  const { publicId } = req.body || {}
  const result = await deleteStoreImage(publicId)
  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.json(result)
}
