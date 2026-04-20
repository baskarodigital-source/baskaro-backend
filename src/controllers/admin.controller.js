import mongoose from 'mongoose'
import { getCatalogStructure, updateVariantPriceDelta } from '../services/catalog.service.js'
import {
  adminDelete,
  adminGetOrders,
  adminPatchOrderStatus,
} from './orders.controller.js'

export async function adminGetCatalog(_req, res) {
  const structure = await getCatalogStructure()
  return res.json(structure)
}

export async function adminUpdateVariant(req, res) {
  const { priceDelta } = req.body || {}
  const { variantId } = req.params
  if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
    return res.status(400).json({ error: 'variantId must be a valid ObjectId' })
  }
  const result = await updateVariantPriceDelta(variantId, priceDelta)
  if (result.error) return res.status(400).json(result)
  return res.json(result.variant)
}

// Re-export order admin endpoints so `routes/admin.js` stays simple.
export { adminDelete, adminGetOrders, adminPatchOrderStatus }

