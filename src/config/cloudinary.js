import { v2 as cloudinary } from 'cloudinary'

const LOG_PREFIX = '[Cloudinary]'

let configured = false

const ENV_KEYS = [
  ['CLOUDINARY_CLOUD_NAME', 'cloud name'],
  ['CLOUDINARY_API_KEY', 'API key'],
  ['CLOUDINARY_API_SECRET', 'API secret'],
]

export function getMissingCloudinaryEnvVars() {
  return ENV_KEYS.filter(([key]) => !String(process.env[key] || '').trim()).map(([, label]) => label)
}

export function isCloudinaryConfigured() {
  return getMissingCloudinaryEnvVars().length === 0
}

/** Call once before uploads; safe to call repeatedly. */
export function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) return false
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
    console.log(`${LOG_PREFIX} SDK configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`)
  }
  return true
}

/** Ping Cloudinary API to confirm credentials (not just env presence). */
export async function verifyCloudinaryConnection() {
  const missing = getMissingCloudinaryEnvVars()
  if (missing.length) {
    return { connected: false, configured: false, missing, error: `Missing: ${missing.join(', ')}` }
  }

  ensureCloudinaryConfigured()

  try {
    const ping = await cloudinary.api.ping()
    const status = ping?.status || 'ok'
    return {
      connected: status === 'ok',
      configured: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status,
    }
  } catch (err) {
    const message = err?.message || err?.error?.message || String(err)
    return {
      connected: false,
      configured: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      error: message,
    }
  }
}

/** Startup log — env check + optional live ping. */
export async function logCloudinaryStatus({ ping = true } = {}) {
  const missing = getMissingCloudinaryEnvVars()
  if (missing.length) {
    console.warn(
      `${LOG_PREFIX} NOT configured — missing ${missing.join(', ')}. Admin image uploads will return 503 until .env is set.`,
    )
    return { connected: false, configured: false, missing }
  }

  console.log(`${LOG_PREFIX} env OK — cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`)

  if (!ping) {
    return { connected: null, configured: true, cloudName: process.env.CLOUDINARY_CLOUD_NAME }
  }

  const result = await verifyCloudinaryConnection()
  if (result.connected) {
    console.log(`${LOG_PREFIX} connected — API ping OK (${result.status})`)
  } else {
    console.error(
      `${LOG_PREFIX} NOT connected — credentials present but API ping failed: ${result.error || 'unknown error'}`,
    )
  }
  return result
}

export { cloudinary }