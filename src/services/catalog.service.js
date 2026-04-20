import { Brand } from '../models/Brand.js'
import { PhoneModel } from '../models/PhoneModel.js'

export async function getActiveBrands() {
  return Brand.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean()
}

/** Brands that have at least one active phone model (filters out accessories-only brands). */
export async function getActiveBrandsWithActiveModels() {
  const brandIds = await PhoneModel.distinct('brandId', { active: true })
  if (!brandIds?.length) return []
  return Brand.find({ _id: { $in: brandIds }, active: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
}

export async function getActiveModelsByBrandId(brandId) {
  return PhoneModel.find({ brandId, active: true }).sort({ modelName: 1 }).lean()
}

export async function getActiveVariantsByPhoneModelId(modelId) {
  // Legacy variants collection is optional; new catalog uses `PhoneModel.storageVariants`.
  // Keep endpoint stable by returning an empty list for now.
  return []
}

function gbLabel(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return String(n)
  return `${v}GB`
}

/**
 * Returns a nested catalog structure compatible with the frontend mock:
 * { [BrandName]: { [ModelName]: { basePrice, variants: [{ ram, storage, priceDelta }] } } }
 */
export async function getCatalogStructure() {
  const brands = await Brand.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean()
  const models = await PhoneModel.find({ active: true }).lean()

  const modelsByBrand = new Map()
  for (const m of models) {
    const key = String(m.brandId)
    if (!modelsByBrand.has(key)) modelsByBrand.set(key, [])
    modelsByBrand.get(key).push(m)
  }

  const out = {}
  for (const b of brands) {
    out[b.name] = out[b.name] || {}
    const brandModels = modelsByBrand.get(String(b._id)) || []
    for (const m of brandModels) {
      const vs = Array.isArray(m.storageVariants) ? m.storageVariants : []
      out[b.name][m.modelName] = {
        basePrice: m.basePrice ?? 0,
        variants: vs.map((v, idx) => ({
          ram: v.ram,
          storage: v.label,
          priceDelta: 0,
          label: v.label,
          variantId: `${String(m._id)}:${idx}`,
          basePrice: v.basePrice ?? m.basePrice ?? 0,
        })),
      }
    }
  }

  return out
}

export async function updateVariantPriceDelta(variantId, priceDeltaInr) {
  const delta = Number(priceDeltaInr)
  if (!Number.isFinite(delta)) return { error: 'priceDelta must be a number.' }
  const updated = await Variant.findByIdAndUpdate(
    variantId,
    { priceDeltaInr: delta },
    { new: true },
  )
  if (!updated) return { error: 'Variant not found.' }
  return { ok: true, variant: updated.toObject() }
}

