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
  return next
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

