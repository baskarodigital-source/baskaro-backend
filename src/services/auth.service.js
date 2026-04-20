import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { User } from '../models/User.js'
import { Admin } from '../models/Admin.js'
import { OtpChallenge } from '../models/OtpChallenge.js'

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret'

/** Staff roles when a legacy row still lives in `User` (prefer `Admin` collection for new accounts). */
const STAFF_ROLES = ['admin', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT']

function isStaffUserDoc(user) {
  return !!(user?.role && STAFF_ROLES.includes(user.role))
}

function generateOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function signUserToken(user) {
  const staff = isStaffUserDoc(user)
  return jwt.sign(
    {
      userId: String(user._id),
      accountType: staff ? 'admin' : 'user',
      role: staff ? user.role : 'user',
      email: user.email || '',
      phone: user.phone || '',
    },
    JWT_SECRET(),
    { expiresIn: '7d' },
  )
}

export function signAdminToken(admin) {
  return jwt.sign(
    {
      adminId: String(admin._id),
      accountType: 'admin',
      role: admin.role,
      email: admin.email || '',
      phone: admin.phone || '',
    },
    JWT_SECRET(),
    { expiresIn: '7d' },
  )
}

/** @deprecated Use signUserToken — kept for any internal call sites */
export function signAuthToken(user) {
  return signUserToken(user)
}

export async function requestOtpForPhone({ phone }) {
  const normalized = String(phone || '').replace(/\D/g, '')
  if (normalized.length !== 10) {
    return { error: 'Phone must be a valid 10-digit number (without country code).' }
  }

  // If the phone belongs to an admin account, allow OTP login for admin.
  const admin = await Admin.findOne({ phone: normalized }).lean()
  const user = admin ? null : await User.findOne({ phone: normalized }).lean()
  if (!admin && !user) return { error: 'Account not found. Please register first.' }

  const code = generateOtp6()
  const otpHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await OtpChallenge.create({
    userId: admin?._id ?? user?._id,
    phone: normalized,
    otpHash,
    expiresAt,
    consumedAt: null,
  })

  return { ok: true, otp: code }
}

export async function verifyPhoneOtp({ phone, otp }) {
  const normalized = String(phone || '').replace(/\D/g, '')
  const code = String(otp || '')

  const challenge = await OtpChallenge.findOne({
    phone: normalized,
    expiresAt: { $gt: new Date() },
    consumedAt: null,
  }).sort({ createdAt: -1 })

  if (!challenge) return { error: 'OTP expired or invalid.' }
  const match = await bcrypt.compare(code, challenge.otpHash)
  if (!match) return { error: 'OTP expired or invalid.' }

  await OtpChallenge.updateOne({ _id: challenge._id }, { $set: { consumedAt: new Date() } })

  // Staff may share the same mobile as their Admin record; OTP must log them in as admin, not as a customer User.
  const admin = await Admin.findOne({ phone: normalized })
  if (admin) {
    if (admin.status === 'BLOCKED') return { error: 'Account is blocked.' }
    const token = signAdminToken(admin)
    return {
      ok: true,
      token,
      user: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        role: admin.role,
        accountType: 'admin',
      },
    }
  }

  const user = await User.findOne({ phone: normalized })
  if (!user) return { error: 'Account not found. Please register first.' }

  const token = signUserToken(user)

  return {
    ok: true,
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'user',
      accountType: 'user',
    },
  }
}

export async function emailRegister({ name, email, phone, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail || !normalizedEmail.includes('@')) return { error: 'Invalid email.' }
  if (!password || String(password).length < 6) return { error: 'Password must be at least 6 characters.' }

  const [existingUser, existingAdmin] = await Promise.all([
    User.findOne({ email: normalizedEmail }).lean(),
    Admin.findOne({ email: normalizedEmail }).lean(),
  ])
  if (existingUser || existingAdmin) return { error: 'Email already registered.' }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    name: name || '',
    email: normalizedEmail,
    phone: phone ? String(phone).replace(/\D/g, '') : '',
    role: 'user',
    passwordHash,
  })

  const token = signUserToken(user)
  return {
    ok: true,
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'user',
      accountType: 'user',
    },
  }
}

export async function emailLogin({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail || !normalizedEmail.includes('@')) return { error: 'Invalid email.' }

  const admin = await Admin.findOne({ email: normalizedEmail })
  if (admin?.passwordHash) {
    if (admin.status === 'BLOCKED') return { error: 'Account is blocked.' }
    const match = await bcrypt.compare(String(password || ''), admin.passwordHash)
    if (!match) return { error: 'Invalid credentials.' }
    const token = signAdminToken(admin)
    return {
      ok: true,
      token,
      user: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        role: admin.role,
        accountType: 'admin',
      },
    }
  }

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) return { error: 'Account not found. Please register first.' }
  if (!user.passwordHash) return { error: 'This account does not have a password. Please login with OTP.' }

  const match = await bcrypt.compare(String(password || ''), user.passwordHash)
  if (!match) return { error: 'Invalid credentials.' }

  const staff = isStaffUserDoc(user)
  const token = signUserToken(user)
  return {
    ok: true,
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: staff ? user.role : 'user',
      accountType: staff ? 'admin' : 'user',
    },
  }
}

export async function updateProfile(userId, { name, email, phone }) {
  const updates = {}
  if (typeof name === 'string') updates.name = name
  if (typeof email === 'string' && email.trim()) updates.email = email.trim().toLowerCase()
  if (typeof phone === 'string') updates.phone = phone.replace(/\D/g, '')

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).lean()
  if (!user) return { error: 'User not found.' }
  return { ok: true, user }
}
