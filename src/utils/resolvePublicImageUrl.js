/**
 * Normalize image fields for API responses (Cloudinary HTTPS, /hero paths, legacy data URLs).
 */
export function resolvePublicImageUrl(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t) || t.startsWith('data:')) return t
  const base = String(process.env.PUBLIC_API_URL || process.env.API_BASE_URL || '').replace(/\/$/, '')
  if (t.startsWith('/')) return base ? `${base}${t}` : t
  return base ? `${base}/${t.replace(/^\//, '')}` : t
}
