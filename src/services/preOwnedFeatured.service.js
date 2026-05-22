import { Inventory } from '../models/Inventory.js'
import { resolvePublicImageUrl } from '../utils/resolvePublicImageUrl.js'

function maxModelMrp(model) {
  if (!model || typeof model !== 'object') return 0
  let m = Number(model.basePrice) || 0
  const vars = Array.isArray(model.storageVariants) ? model.storageVariants : []
  for (const v of vars) {
    m = Math.max(m, Number(v?.basePrice) || 0)
  }
  return m
}

function gradeLabel(grade) {
  const g = String(grade || '').toUpperCase()
  if (g === 'EXCELLENT') return 'Excellent'
  if (g === 'GOOD') return 'Good'
  if (g === 'AVERAGE') return 'Average'
  if (g === 'BROKEN') return 'Fair'
  return 'Pre-Owned'
}

function tagsForItem(conditionGrade) {
  const g = String(conditionGrade || '').toUpperCase()
  const tags = ['Pre-Owned']
  if (g === 'EXCELLENT') tags.push('Top Seller')
  else if (g === 'GOOD') tags.push('Flash Sale')
  else tags.push('Value Deal')
  return tags
}

/**
 * Homepage / marketing: in-stock pre-owned units with populated model + brand.
 * @param {{ limit?: number }} opts
 */
export async function listFeaturedPreOwned({ limit = 12 } = {}) {
  const l = Math.min(24, Math.max(1, parseInt(String(limit), 10) || 12))
  const rows = await Inventory.find({
    isSold: false,
    stock: { $gt: 0 },
  })
    .populate('modelId', 'modelName slug image basePrice storageVariants')
    .populate('brandId', 'name slug')
    .sort({ createdAt: -1 })
    .limit(l)
    .lean()

  return rows.map((row) => mapRow(row)).filter(Boolean)
}

function mapRow(row) {
  const model = row.modelId
  const brand = row.brandId
  if (!model || !brand) return null

  const brandName = String(brand.name || '').trim()
  const modelName = String(model.modelName || '').trim()
  const slug = String(model.slug || '').trim()
  if (!modelName) return null

  const title = `${brandName} ${modelName} - Pre-Owned`.trim()
  const sale = Math.max(0, Math.round(Number(row.price) || 0))
  let mrp = maxModelMrp(model)
  if (!Number.isFinite(mrp) || mrp <= sale) {
    mrp = Math.max(sale + 1, Math.round(sale * 1.12))
  }
  const discountPercent = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : null

  const invImgs = Array.isArray(row.images) ? row.images.map((x) => String(x || '').trim()).filter(Boolean) : []
  const rawImg = invImgs[0] || String(model.image || '').trim()
  const imageUrl = resolvePublicImageUrl(rawImg)

  const id = String(row._id)
  const modelId = String(model._id || '').trim()
  const viewPath =
    slug && id
      ? `/buy-pre-owned/product/phone/${encodeURIComponent(slug)}/${encodeURIComponent(id)}${
          modelId ? `?modelId=${encodeURIComponent(modelId)}` : ''
        }`
      : ''

  return {
    id,
    title,
    imageUrl,
    priceInr: sale,
    originalPriceInr: mrp > sale ? mrp : null,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
    rating: null,
    tags: tagsForItem(row.conditionGrade),
    conditionLabel: gradeLabel(row.conditionGrade),
    viewPath,
    modelSlug: slug,
    modelId: modelId || null,
  }
}
