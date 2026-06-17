import { resolvePublicImageUrl } from './resolvePublicImageUrl.js'

const GRADE_LABELS = {
  EXCELLENT: 'Superb',
  GOOD: 'Good',
  AVERAGE: 'Fair',
  BROKEN: 'Fair',
}

export function gradeLabel(grade) {
  const g = String(grade || '').toUpperCase()
  return GRADE_LABELS[g] || 'Pre-Owned'
}

/**
 * @param {object} row - Inventory doc (lean or mongoose)
 * @param {{ viewerUserId?: string }} [opts]
 */
export function mapPublicInventory(row, opts = {}) {
  if (!row) return null

  const model = row.modelId
  const brand = row.brandId
  const now = new Date()
  const reservedActive = row.reservedUntil && new Date(row.reservedUntil) > now
  const reservedByViewer =
    reservedActive && opts.viewerUserId && String(row.reservedBy) === String(opts.viewerUserId)

  let availability = 'AVAILABLE'
  if (row.isSold || row.stock <= 0) availability = 'SOLD'
  else if (reservedActive && !reservedByViewer) availability = 'RESERVED'

  const invImgs = Array.isArray(row.images) ? row.images.map((x) => String(x || '').trim()).filter(Boolean) : []
  const rawImg = invImgs[0] || String(model?.image || '').trim()
  const imageUrl = resolvePublicImageUrl(rawImg)

  const brandName = String(brand?.name || '').trim()
  const modelName = String(model?.modelName || '').trim()
  const title = `${brandName} ${modelName}`.trim() || 'Pre-Owned Device'

  return {
    id: String(row._id),
    inventoryId: String(row._id),
    modelId: model?._id ? String(model._id) : '',
    brandId: brand?._id ? String(brand._id) : '',
    brandName,
    modelName,
    slug: String(model?.slug || '').trim(),
    title,
    conditionGrade: row.conditionGrade,
    conditionLabel: gradeLabel(row.conditionGrade),
    price: Math.round(Number(row.price) || 0),
    stock: Number(row.stock) || 0,
    isSold: Boolean(row.isSold),
    availability,
    available: availability === 'AVAILABLE' || reservedByViewer,
    reservedByYou: reservedByViewer,
    reservedUntil: reservedByViewer ? row.reservedUntil : undefined,
    imageUrl,
    images: invImgs.map((u) => resolvePublicImageUrl(u)).filter(Boolean),
    specifications: row.specifications || {},
  }
}
