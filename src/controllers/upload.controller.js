import { logCloudinaryStatus } from '../config/cloudinary.js'
import { getCloudinaryStatus, uploadStoreImage, deleteStoreImage } from '../services/cloudinary.service.js'

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

export async function removeImage(req, res) {
  const { publicId } = req.body || {}
  const result = await deleteStoreImage(publicId)
  if (result.error) {
    const status = result.error.includes('not configured') ? 503 : 400
    return res.status(status).json({ error: result.error })
  }
  return res.json(result)
}
