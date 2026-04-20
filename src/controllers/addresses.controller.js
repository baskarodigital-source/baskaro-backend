import { createAddress, deleteAddress, listAddresses } from '../services/addresses.service.js'
import mongoose from 'mongoose'

export async function getMyAddresses(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
  const addresses = await listAddresses(userId)
  return res.json(addresses)
}

export async function postMyAddress(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

  const result = await createAddress(userId, req.body || {})
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

export async function deleteMyAddress(req, res) {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

  const { addressId } = req.params
  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ error: 'addressId must be a valid ObjectId' })
  }

  const result = await deleteAddress(userId, addressId)
  if (result.error) return res.status(400).json(result)
  return res.json(result)
}

