import jwt from 'jsonwebtoken'

const ADMIN_ROLES = ['admin', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT']

function normalizeAuthPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const next = { ...payload }
  if (!next.accountType) {
    if (next.adminId) next.accountType = 'admin'
    else if (next.role && ADMIN_ROLES.includes(next.role)) next.accountType = 'admin'
    else next.accountType = 'user'
  }
  // Admin tokens use `adminId`; customer routes expect `userId`.
  if (!next.userId && next.adminId) next.userId = next.adminId
  return next
}

/** Resolved Mongo id for the signed-in account (customer or admin). */
export function getAuthUserId(req) {
  const u = req.user
  if (!u) return null
  return u.userId || u.adminId || null
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = normalizeAuthPayload(payload)
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid auth token' })
  }
}

/** Sets req.user when a valid Bearer token is present; never rejects. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = normalizeAuthPayload(payload)
  } catch {
    /* ignore invalid optional token */
  }
  return next()
}

export function requireAdmin(req, res, next) {
  const u = req.user
  const isAdmin =
    u?.accountType === 'admin' ||
    (u?.role && ADMIN_ROLES.includes(u.role))
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  return next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of these roles: ${roles.join(', ')}` })
    }
    return next()
  }
}

export function requireSuperAdmin(req, res, next) {
  return requireRole('SUPER_ADMIN')(req, res, next)
}

