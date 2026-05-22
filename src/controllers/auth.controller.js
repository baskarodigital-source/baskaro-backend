import {
  emailLogin,
  emailRegister,
  registerPhoneAndRequestOtp,
  requestOtpForPhone,
  updateProfile,
  verifyPhoneOtp,
} from '../services/auth.service.js'

import { User } from '../models/User.js'
import { Admin } from '../models/Admin.js'

const ADMIN_ROLES = new Set(['admin', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'])

export async function requestOtp(req, res) {
  const { phone } = req.body || {}
  const result = await requestOtpForPhone({ phone })
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function registerPhone(req, res) {
  const { name, phone } = req.body || {}
  const result = await registerPhoneAndRequestOtp({ name, phone })
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function verifyOtp(req, res) {
  const { phone, otp } = req.body || {}
  const result = await verifyPhoneOtp({ phone, otp })
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function registerEmail(req, res) {
  const { name, email, phone, password } = req.body || {}
  const result = await emailRegister({ name, email, phone, password })
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function loginEmail(req, res) {
  const { email, password } = req.body || {}
  const result = await emailLogin({ email, password })
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function me(req, res) {
  const u = req.user
  if (!u?.userId && !u?.adminId) return res.status(401).json({ error: 'Unauthenticated' })

  if (u.adminId || u.accountType === 'admin' || ADMIN_ROLES.has(u.role)) {
    const id = u.adminId || u.userId
    const admin = id ? await Admin.findById(id).lean() : null
    if (admin) {
      return res.json({
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        role: admin.role,
        accountType: 'admin',
      })
    }
  }

  const userId = u.userId
  if (!userId) return res.status(404).json({ error: 'User not found' })
  const user = await User.findById(userId).lean()
  if (!user) return res.status(404).json({ error: 'User not found' })
  const accountType = ADMIN_ROLES.has(user.role) ? 'admin' : 'user'
  return res.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountType,
  })
}

export async function updateMe(req, res) {
  const u = req.user
  if (u?.accountType === 'admin' || u?.adminId || ADMIN_ROLES.has(u?.role)) {
    return res.status(403).json({ error: 'Customer profile updates only' })
  }
  const userId = u?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

  const result = await updateProfile(userId, req.body || {})
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

