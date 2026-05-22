/** Short CDN/browser cache for public read-only JSON (homepage lists). */
export function cachePublicJson(maxAgeSeconds = 60) {
  const maxAge = Math.max(0, Number(maxAgeSeconds) || 60)
  return (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=120`)
    next()
  }
}
