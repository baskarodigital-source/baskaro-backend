import mongoose from 'mongoose'
import { Brand } from '../models/Brand.js'
import { BrandDevice } from '../models/BrandDevice.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination, formatPaginationResponse } from '../utils/helpers.js'

function slugify(input) {
  const s = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s
}

/** 24-char hex → Mongo `_id`; anything else (e.g. `samsung-s25-edge`) → lookup by `slug`. */
function isPhoneModelObjectIdParam(param) {
  const s = String(param || '').trim()
  return s.length === 24 && /^[a-fA-F0-9]+$/i.test(s)
}

/** URL slugs that omit `galaxy` / `apple` still need to match admin-generated slugs. */
function phoneModelSlugCandidates(raw) {
  const s = String(raw || '').trim().toLowerCase()
  const out = []
  const seen = new Set()
  const push = (slug) => {
    if (!slug || seen.has(slug)) return
    seen.add(slug)
    out.push(slug)
  }
  push(s)
  if (s.startsWith('samsung-') && !s.startsWith('samsung-galaxy-')) {
    push(`samsung-galaxy-${s.slice('samsung-'.length)}`)
  }
  if (s.startsWith('iphone-')) {
    push(`apple-iphone-${s.slice('iphone-'.length)}`)
  }
  return out
}

const phoneModelPopulate = [
  { path: 'brandId', select: 'name slug' },
  { path: 'deviceId', select: 'name slug' },
]

async function findPhoneModelByIdOrSlugPopulated(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null
  if (isPhoneModelObjectIdParam(trimmed)) {
    return PhoneModel.findById(trimmed).populate(phoneModelPopulate)
  }
  for (const slug of phoneModelSlugCandidates(trimmed)) {
    const doc = await PhoneModel.findOne({ slug }).populate(phoneModelPopulate)
    if (doc) return doc
  }
  return null
}

// ==================== BRAND SERVICES ====================

// Get all brands
export async function getAllBrands({ page = 1, limit = 10, active = true, ribbonCategoryId } = {}) {
  const { skip } = getPagination(page, limit)

  const query = {}
  if (active !== null) {
    query.active = active
  }
  if (ribbonCategoryId && mongoose.Types.ObjectId.isValid(ribbonCategoryId)) {
    query.ribbonCategoryId = new mongoose.Types.ObjectId(ribbonCategoryId)
  }

  const [brands, total] = await Promise.all([
    Brand.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Brand.countDocuments(query),
  ])

  return formatPaginationResponse(brands, total, page, limit)
}

// Get brand by ID
export async function getBrandById(brandId) {
  const brand = await Brand.findById(brandId)
  
  if (!brand) {
    throw new AppError('Brand not found', 404, errorCodes.NOT_FOUND)
  }
  
  return brand
}

// Create brand
export async function createBrand(brandData) {
  const name = String(brandData?.name || '').trim()
  if (!name) {
    throw new AppError('Brand name is required', 400, errorCodes.VALIDATION_ERROR)
  }

  const preferredSlug = slugify(brandData?.slug || name)
  if (!preferredSlug) {
    throw new AppError('Brand slug is required', 400, errorCodes.VALIDATION_ERROR)
  }

  // Ensure unique slug: <slug>, <slug>-2, <slug>-3, ...
  let slug = preferredSlug
  for (let i = 2; await Brand.exists({ slug }); i++) {
    slug = `${preferredSlug}-${i}`
  }

  const brand = await Brand.create({ ...brandData, name, slug })
  return brand
}

// Update brand
export async function updateBrand(brandId, updateData) {
  const brand = await Brand.findByIdAndUpdate(
    brandId,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!brand) {
    throw new AppError('Brand not found', 404, errorCodes.NOT_FOUND)
  }
  
  return brand
}

// Delete brand
export async function deleteBrand(brandId) {
  const brand = await Brand.findByIdAndDelete(brandId)
  
  if (!brand) {
    throw new AppError('Brand not found', 404, errorCodes.NOT_FOUND)
  }
  
  // Optionally check if any models reference this brand
  const modelCount = await PhoneModel.countDocuments({ brandId })
  if (modelCount > 0) {
    throw new AppError(`Cannot delete brand. ${modelCount} phone models are associated with it.`, 400, errorCodes.BAD_REQUEST)
  }
  
  return { success: true, message: 'Brand deleted successfully' }
}

// ==================== BRAND DEVICE (SUBCATEGORY) SERVICES ====================

export async function getAllBrandDevices({ brandId, page = 1, limit = 50, active = true } = {}) {
  const { skip } = getPagination(page, limit)
  if (!brandId) throw new AppError('brandId is required', 400, errorCodes.VALIDATION_ERROR)

  const query = { brandId: new mongoose.Types.ObjectId(brandId) }
  if (active !== null) query.active = active

  const [items, total] = await Promise.all([
    BrandDevice.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
    BrandDevice.countDocuments(query),
  ])

  return formatPaginationResponse(items, total, page, limit)
}

export async function createBrandDevice(data) {
  const brandId = data?.brandId
  if (!brandId) throw new AppError('brandId is required', 400, errorCodes.VALIDATION_ERROR)
  const name = String(data?.name || '').trim()
  if (!name) throw new AppError('Device name is required', 400, errorCodes.VALIDATION_ERROR)

  const preferredSlug = slugify(data?.slug || name)
  if (!preferredSlug) throw new AppError('slug is required', 400, errorCodes.VALIDATION_ERROR)

  let slug = preferredSlug
  for (let i = 2; await BrandDevice.exists({ brandId, slug }); i++) {
    slug = `${preferredSlug}-${i}`
  }

  const last = await BrandDevice.findOne({ brandId }).sort({ sortOrder: -1 }).lean()
  const sortOrder = (last?.sortOrder ?? -1) + 1

  return BrandDevice.create({ ...data, name, slug, sortOrder })
}

export async function updateBrandDevice(deviceId, updateData) {
  const doc = await BrandDevice.findByIdAndUpdate(deviceId, updateData, { new: true, runValidators: true })
  if (!doc) throw new AppError('Device not found', 404, errorCodes.NOT_FOUND)
  return doc
}

export async function deleteBrandDevice(deviceId) {
  const doc = await BrandDevice.findById(deviceId)
  if (!doc) throw new AppError('Device not found', 404, errorCodes.NOT_FOUND)

  const modelCount = await PhoneModel.countDocuments({ deviceId: doc._id })
  if (modelCount > 0) {
    throw new AppError(`Cannot delete device. ${modelCount} models are associated with it.`, 400, errorCodes.BAD_REQUEST)
  }

  await doc.deleteOne()
  return { success: true, message: 'Device deleted successfully' }
}

// ==================== PHONE MODEL SERVICES ====================

// Get all phone models
export async function getAllPhoneModels({ brandId, deviceId, page = 1, limit = 10, active = true }) {
  const { skip } = getPagination(page, limit)
  
  const query = {}
  if (brandId) {
    query.brandId = brandId
  }
  if (deviceId) {
    query.deviceId = deviceId
  }
  if (active !== null) {
    query.active = active
  }
  
  const [models, total] = await Promise.all([
    PhoneModel.find(query)
      .populate('brandId', 'name slug')
      .populate('deviceId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PhoneModel.countDocuments(query),
  ])
  
  return formatPaginationResponse(models, total, page, limit)
}

// Get phone model by Mongo _id or by slug (URL-friendly id)
export async function getPhoneModelById(modelId) {
  const raw = String(modelId || '').trim()
  if (!raw) {
    throw new AppError('model id is required', 400, errorCodes.BAD_REQUEST)
  }
  const model = await findPhoneModelByIdOrSlugPopulated(raw)

  if (!model) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }

  return model
}

// Create phone model
export async function createPhoneModel(modelData) {
  const modelName = String(modelData?.modelName || '').trim()
  if (!modelData?.brandId) {
    throw new AppError('brandId is required', 400, errorCodes.VALIDATION_ERROR)
  }
  if (!modelData?.deviceId) {
    throw new AppError('deviceId is required', 400, errorCodes.VALIDATION_ERROR)
  }
  if (!modelName) {
    throw new AppError('modelName is required', 400, errorCodes.VALIDATION_ERROR)
  }
  const basePrice = Number(modelData?.basePrice)
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new AppError('basePrice must be a positive number', 400, errorCodes.VALIDATION_ERROR)
  }

  const preferredSlug = slugify(modelData?.slug || modelName)
  if (!preferredSlug) {
    throw new AppError('slug is required', 400, errorCodes.VALIDATION_ERROR)
  }

  // Ensure unique slug per brand: <slug>, <slug>-2, <slug>-3, ...
  let slug = preferredSlug
  for (let i = 2; await PhoneModel.exists({ slug, brandId: modelData.brandId }); i++) {
    slug = `${preferredSlug}-${i}`
  }

  const model = await PhoneModel.create({
    ...modelData,
    modelName,
    basePrice,
    slug,
  })
  await model.populate([
    { path: 'brandId', select: 'name slug' },
    { path: 'deviceId', select: 'name slug' },
  ])
  return model
}

// Update phone model (by Mongo _id or slug)
export async function updatePhoneModel(modelId, updateData) {
  const raw = String(modelId || '').trim()
  if (!raw) {
    throw new AppError('model id is required', 400, errorCodes.BAD_REQUEST)
  }
  const existing = await findPhoneModelByIdOrSlugPopulated(raw)
  if (!existing) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }
  const model = await PhoneModel.findOneAndUpdate({ _id: existing._id }, updateData, {
    new: true,
    runValidators: true,
  }).populate(phoneModelPopulate)

  if (!model) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }

  return model
}

// Delete phone model (by Mongo _id or slug)
export async function deletePhoneModel(modelId) {
  const raw = String(modelId || '').trim()
  if (!raw) {
    throw new AppError('model id is required', 400, errorCodes.BAD_REQUEST)
  }
  const existing = await findPhoneModelByIdOrSlugPopulated(raw)
  if (!existing) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }
  await PhoneModel.findOneAndDelete({ _id: existing._id })

  return { success: true, message: 'Phone model deleted successfully' }
}
