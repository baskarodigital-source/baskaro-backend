import mongoose from 'mongoose'
import { Brand } from '../models/Brand.js'
import { BrandDevice } from '../models/BrandDevice.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { normalizeModelConditionGrades } from '../constants/modelConditionGrades.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination, formatPaginationResponse } from '../utils/helpers.js'
import {
  persistImageToCloudinary,
  persistImagesArray,
  persistVideoToCloudinary,
  persistVideosArray,
} from '../utils/persistImageToCloudinary.js'

async function persistBrandPayload(data) {
  const next = { ...data }
  if (next.imageUrl != null && String(next.imageUrl).trim()) {
    next.imageUrl = await persistImageToCloudinary(next.imageUrl, CLOUDINARY_FOLDERS.brands)
  }
  return next
}

async function persistDevicePayload(data) {
  const next = { ...data }
  if (next.imageUrl != null && String(next.imageUrl).trim()) {
    next.imageUrl = await persistImageToCloudinary(next.imageUrl, CLOUDINARY_FOLDERS.devices)
  }
  return next
}

function normalizeHexColor(hex) {
  const h = String(hex || '').trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) return h
  if (/^[0-9A-Fa-f]{6}$/.test(h)) return `#${h}`
  return '#cccccc'
}

async function persistColorVariants(variants) {
  if (!Array.isArray(variants)) return []
  const out = []
  for (const row of variants) {
    const name = String(row?.name || '').trim()
    const hex = normalizeHexColor(row?.hex)
    if (!name) continue

    const rawImages = []
    const pushImg = (v) => {
      const u = String(v || '').trim()
      if (u) rawImages.push(u)
    }
    pushImg(row?.image)
    if (Array.isArray(row?.images)) row.images.forEach(pushImg)

    const images = []
    const seen = new Set()
    for (const raw of rawImages) {
      if (seen.has(raw)) continue
      seen.add(raw)
      const url = await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.models)
      if (url) images.push(url)
    }
    if (!images.length) continue

    let videoUrls = []
    if (Array.isArray(row?.videoUrls) && row.videoUrls.length) {
      videoUrls = await persistVideosArray(row.videoUrls.filter(Boolean), CLOUDINARY_FOLDERS.videos)
    }

    out.push({ name, hex, image: images[0], images, videoUrls })
  }
  return out
}

async function persistModelPayload(data) {
  const next = { ...data }
  if (next.image != null && String(next.image).trim()) {
    next.image = await persistImageToCloudinary(next.image, CLOUDINARY_FOLDERS.models)
  }
  if (next.imageUrl != null && String(next.imageUrl).trim()) {
    next.imageUrl = await persistImageToCloudinary(next.imageUrl, CLOUDINARY_FOLDERS.models)
  }
  if (Array.isArray(next.images)) {
    next.images = await persistImagesArray(next.images, CLOUDINARY_FOLDERS.models)
  }
  if (next.colorVariants !== undefined) {
    next.colorVariants = await persistColorVariants(next.colorVariants)
  }
  if (next.conditionGrades !== undefined) {
    next.conditionGrades = normalizeModelConditionGrades(next.conditionGrades)
  }
  if (Array.isArray(next.videoUrls) && next.videoUrls.length) {
    next.videoUrls = await persistVideosArray(next.videoUrls, CLOUDINARY_FOLDERS.videos)
    next.videoUrl = next.videoUrls[0] || ''
  } else {
    const rawVideo = String(next.videoUrl ?? next.video ?? '').trim()
    if (rawVideo) {
      next.videoUrl = await persistVideoToCloudinary(rawVideo, CLOUDINARY_FOLDERS.videos)
      next.videoUrls = next.videoUrl ? [next.videoUrl] : []
    } else {
      next.videoUrl = ''
      next.videoUrls = []
    }
  }
  delete next.video
  return next
}

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

  const payload = await persistBrandPayload({ ...brandData, name, slug })
  const brand = await Brand.create(payload)
  return brand
}

// Update brand
export async function updateBrand(brandId, updateData) {
  const payload = await persistBrandPayload(updateData)
  const brand = await Brand.findByIdAndUpdate(
    brandId,
    payload,
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

  const payload = await persistDevicePayload({ ...data, name, slug, sortOrder })
  return BrandDevice.create(payload)
}

export async function updateBrandDevice(deviceId, updateData) {
  const payload = await persistDevicePayload(updateData)
  const doc = await BrandDevice.findByIdAndUpdate(deviceId, payload, { new: true, runValidators: true })
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

  const payload = await persistModelPayload({
    ...modelData,
    modelName,
    basePrice,
    slug,
  })
  if (!payload.conditionGrades?.length) {
    throw new AppError('At least one condition grade is required (Superb, Good, or Fair)', 400, errorCodes.VALIDATION_ERROR)
  }
  const model = await PhoneModel.create(payload)
  await model.populate([
    { path: 'brandId', select: 'name slug' },
    { path: 'deviceId', select: 'name slug' },
  ])
  return model
}

function buildPhoneModelUpdateFields(updateData, existing) {
  const out = {}
  const existingPlain = typeof existing?.toObject === 'function' ? existing.toObject() : existing

  if (updateData.brandId != null && String(updateData.brandId).trim()) {
    out.brandId = updateData.brandId
  }

  if (updateData.deviceId !== undefined) {
    const deviceId = String(updateData.deviceId || '').trim()
    if (deviceId) {
      out.deviceId = deviceId
    } else if (existingPlain?.deviceId) {
      out.deviceId = existingPlain.deviceId
    } else {
      out.deviceId = null
    }
  }

  if (updateData.modelName != null) {
    const modelName = String(updateData.modelName || '').trim()
    if (!modelName) {
      throw new AppError('modelName is required', 400, errorCodes.VALIDATION_ERROR)
    }
    out.modelName = modelName
  }

  if (updateData.basePrice != null) {
    const basePrice = Number(updateData.basePrice)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      throw new AppError('basePrice must be a positive number', 400, errorCodes.VALIDATION_ERROR)
    }
    out.basePrice = basePrice
    const variants = Array.isArray(existingPlain?.storageVariants) ? existingPlain.storageVariants : []
    if (variants.length) {
      out.storageVariants = variants.map((v, idx) => {
        const row = typeof v?.toObject === 'function' ? v.toObject() : { ...v }
        return idx === 0 ? { ...row, basePrice } : row
      })
    }
  }

  if (updateData.specifications != null && typeof updateData.specifications === 'object') {
    out.specifications = updateData.specifications
  }

  if (updateData.image !== undefined) {
    const image = String(updateData.image || '').trim()
    if (image) {
      out.image = image
    } else if (!String(existingPlain?.image || '').trim()) {
      out.image = ''
    }
  }

  if (updateData.images !== undefined) {
    const images = Array.isArray(updateData.images) ? updateData.images.filter(Boolean) : []
    if (images.length) {
      out.images = images
    } else if (!Array.isArray(existingPlain?.images) || !existingPlain.images.length) {
      out.images = []
    }
  }

  if (updateData.videoUrls !== undefined || updateData.videoUrl !== undefined) {
    const videoUrls = Array.isArray(updateData.videoUrls)
      ? updateData.videoUrls.filter(Boolean)
      : updateData.videoUrl
        ? [updateData.videoUrl]
        : []
    if (videoUrls.length) {
      out.videoUrls = videoUrls
      out.videoUrl = videoUrls[0]
    } else if (!String(existingPlain?.videoUrl || '').trim() && !(existingPlain?.videoUrls || []).length) {
      out.videoUrls = []
      out.videoUrl = ''
    }
  }

  if (updateData.active !== undefined) out.active = Boolean(updateData.active)

  if (updateData.colorVariants !== undefined) {
    out.colorVariants = Array.isArray(updateData.colorVariants) ? updateData.colorVariants : []
  }

  if (updateData.conditionGrades !== undefined) {
    out.conditionGrades = normalizeModelConditionGrades(updateData.conditionGrades)
    if (!out.conditionGrades.length) {
      throw new AppError('At least one condition grade is required (Superb, Good, or Fair)', 400, errorCodes.VALIDATION_ERROR)
    }
  }

  return out
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

  const fields = buildPhoneModelUpdateFields(updateData, existing)
  if (!Object.keys(fields).length) {
    throw new AppError('No valid fields to update', 400, errorCodes.BAD_REQUEST)
  }

  const payload = await persistModelPayload(fields)
  const model = await PhoneModel.findByIdAndUpdate(
    existing._id,
    { $set: payload },
    { new: true, runValidators: true },
  ).populate(phoneModelPopulate)

  if (!model) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }

  console.log(
    `[PhoneModel] updated ${model._id} — modelName: ${model.modelName}, basePrice: ${model.basePrice}, deviceId: ${model.deviceId}`,
  )

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
