import { Address } from '../models/Address.js'

export async function listAddresses(userId) {
  return Address.find({ userId }).sort({ createdAt: -1 }).lean()
}

export async function createAddress(userId, { label, line1, city, state, pincode }) {
  if (!line1 || !city || !pincode) return { error: 'line1, city, and pincode are required.' }
  const addr = await Address.create({
    userId,
    label: label || 'Home',
    line1,
    city,
    state: state || '',
    pincode,
  })
  return { ok: true, address: addr.toObject ? addr.toObject() : addr }
}

export async function deleteAddress(userId, addressId) {
  const existing = await Address.findOne({ _id: addressId, userId }).lean()
  if (!existing) return { error: 'Address not found.' }
  await Address.deleteOne({ _id: addressId })
  return { ok: true }
}

