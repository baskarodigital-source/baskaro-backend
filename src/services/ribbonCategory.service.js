import { RibbonCategory } from '../models/RibbonCategory.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { persistImageToCloudinary } from '../utils/persistImageToCloudinary.js'

/** Legacy DB cleanup only — categories are created via admin API, not auto-seeded. */
async function ensureRibbonIndexes() {
  await RibbonCategory.collection.dropIndex('slug_1').catch(() => {})
}

export async function listActiveRibbonCategories() {
  await ensureRibbonIndexes()
  return RibbonCategory.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean()
}

export async function listAllRibbonCategories() {
  await ensureRibbonIndexes()
  return RibbonCategory.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean()
}

export async function createRibbonCategory(body) {
  const { label, path, iconKey, sortOrder, isActive, imageUrl } = body || {}
  if (!label || !iconKey) {
    throw new AppError('label and iconKey are required', 400, errorCodes.BAD_REQUEST)
  }
  const rawImage = imageUrl != null && String(imageUrl).trim() ? String(imageUrl).trim() : ''
  const storedImage = rawImage
    ? await persistImageToCloudinary(rawImage, CLOUDINARY_FOLDERS.ribbon)
    : ''
  const doc = await RibbonCategory.create({
    label: String(label).trim(),
    path: path != null ? String(path).trim() : '/marketplace',
    iconKey,
    imageUrl: storedImage,
    sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    isActive: isActive !== false,
  })
  return doc.toObject()
}

export async function updateRibbonCategory(id, body) {
  const updates = {}
  if (body.label != null) updates.label = String(body.label).trim()
  if (body.path != null) updates.path = String(body.path).trim()
  if (body.iconKey != null) updates.iconKey = body.iconKey
  if (body.imageUrl !== undefined) {
    const raw = body.imageUrl != null ? String(body.imageUrl).trim() : ''
    updates.imageUrl = raw
      ? await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.ribbon)
      : ''
  }
  if (body.sortOrder != null) updates.sortOrder = Number(body.sortOrder)
  if (body.isActive != null) updates.isActive = Boolean(body.isActive)

  const doc = await RibbonCategory.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!doc) throw new AppError('Ribbon category not found', 404, errorCodes.NOT_FOUND)
  return doc.toObject()
}

export async function deleteRibbonCategory(id) {
  const doc = await RibbonCategory.findByIdAndDelete(id)
  if (!doc) throw new AppError('Ribbon category not found', 404, errorCodes.NOT_FOUND)
  return { ok: true }
}
