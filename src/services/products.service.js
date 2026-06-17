import mongoose from 'mongoose'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { formatPaginationResponse } from '../utils/helpers.js'

import * as ProductModelModule from '../models/Product.js'
import * as CategoryModelModule from '../models/Category.js'

const Product = ProductModelModule.Product || ProductModelModule.default || ProductModelModule
const Category = CategoryModelModule.Category || CategoryModelModule.default || CategoryModelModule

function ensureObjectId(id, fieldName = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400, errorCodes.BAD_REQUEST)
  }
}

async function ensureCategoryExists(categoryId) {
  ensureObjectId(categoryId, 'category id')
  const exists = await Category.exists({ _id: categoryId })
  if (!exists) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND)
}

async function resolveBrandAndDevice(input = {}) {
  const out = { ...input }
  const brandId = out.brandId || null
  const deviceId = out.deviceId || null

  if (!brandId && !deviceId) return out

  const { Brand } = await import('../models/Brand.js')
  const { BrandDevice } = await import('../models/BrandDevice.js')

  if (brandId) {
    ensureObjectId(brandId, 'brand id')
    const brand = await Brand.findById(brandId).select('name ribbonCategoryId').lean()
    if (!brand) throw new AppError('Brand not found', 404, errorCodes.NOT_FOUND)

    if (out.category) {
      const category = await Category.findById(out.category).select('ribbonCategoryId').lean()
      const ribbonId = category?.ribbonCategoryId ? String(category.ribbonCategoryId) : ''
      if (ribbonId && brand.ribbonCategoryId && String(brand.ribbonCategoryId) !== ribbonId) {
        throw new AppError('Brand does not belong to the selected category', 400, errorCodes.BAD_REQUEST)
      }
    }

    out.brandId = brand._id
    out.brand = String(brand.name || out.brand || '').trim()
  } else {
    out.brandId = null
  }

  if (deviceId) {
    if (!brandId) {
      throw new AppError('brandId is required when deviceId is set', 400, errorCodes.BAD_REQUEST)
    }
    ensureObjectId(deviceId, 'device id')
    const device = await BrandDevice.findById(deviceId).select('name brandId').lean()
    if (!device) throw new AppError('Device not found', 404, errorCodes.NOT_FOUND)
    if (String(device.brandId) !== String(brandId)) {
      throw new AppError('Device does not belong to the selected brand', 400, errorCodes.BAD_REQUEST)
    }
    out.deviceId = device._id
  } else {
    out.deviceId = null
  }

  return out
}

function normalizeProductInput(payload = {}) {
  const brandId = payload.brandId ? String(payload.brandId).trim() : null
  const deviceId = payload.deviceId ? String(payload.deviceId).trim() : null

  return {
    name: payload.name != null ? String(payload.name).trim() : undefined,
    slug: payload.slug != null ? String(payload.slug).trim() : undefined,
    sku: payload.sku != null ? String(payload.sku).trim() : undefined,
    shortDescription:
      payload.shortDescription != null ? String(payload.shortDescription).trim() : undefined,
    description: payload.description != null ? String(payload.description).trim() : undefined,
    category: payload.category,
    brandId: brandId || (payload.brandId === null ? null : undefined),
    deviceId: deviceId || (payload.deviceId === null ? null : undefined),
    brand: payload.brand != null ? String(payload.brand).trim() : undefined,
    tags: Array.isArray(payload.tags) ? payload.tags : undefined,
    attributes: payload.attributes,
    images: Array.isArray(payload.images) ? payload.images : undefined,
    variants: Array.isArray(payload.variants) ? payload.variants : undefined,
    seo: payload.seo,
    isFeatured: payload.isFeatured != null ? Boolean(payload.isFeatured) : undefined,
    isActive: payload.isActive != null ? Boolean(payload.isActive) : undefined,
  }
}

export async function listProducts({
  page = 1,
  limit = 20,
  categoryId,
  brandId,
  deviceId,
  q,
  includeInactive = false,
} = {}) {
  const p = Math.max(1, Number.parseInt(page, 10) || 1)
  const l = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20))
  const skip = (p - 1) * l

  const query = includeInactive ? {} : { isActive: true }
  if (categoryId) {
    ensureObjectId(categoryId, 'category id')
    query.category = categoryId
  }
  if (brandId) {
    ensureObjectId(brandId, 'brand id')
    query.brandId = brandId
  }
  if (deviceId) {
    ensureObjectId(deviceId, 'device id')
    query.deviceId = deviceId
  }
  if (q && String(q).trim()) {
    const text = String(q).trim()
    query.$or = [
      { name: { $regex: text, $options: 'i' } },
      { slug: { $regex: text, $options: 'i' } },
      { brand: { $regex: text, $options: 'i' } },
    ]
  }

  const [items, total] = await Promise.all([
    Product.find(query)
      .populate('brandId', 'name')
      .populate('deviceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Product.countDocuments(query),
  ])

  return formatPaginationResponse(items, total, p, l)
}

export async function getProductById(id) {
  ensureObjectId(id, 'product id')
  const product = await Product.findById(id)
    .populate('brandId', 'name slug')
    .populate('deviceId', 'name slug')
    .populate('category', 'name slug ribbonCategoryId')
    .lean()
  if (!product) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND)
  return product
}

export async function createProduct(payload = {}) {
  let input = normalizeProductInput(payload)
  if (!input.name) throw new AppError('name is required', 400, errorCodes.BAD_REQUEST)
  if (!input.category) throw new AppError('category is required', 400, errorCodes.BAD_REQUEST)
  await ensureCategoryExists(input.category)
  if (!input.variants || input.variants.length === 0) {
    throw new AppError('At least one variant is required', 400, errorCodes.BAD_REQUEST)
  }

  input = await resolveBrandAndDevice(input)
  Object.keys(input).forEach((key) => input[key] === undefined && delete input[key])

  const created = await Product.create(input)
  return getProductById(created._id)
}

export async function updateProduct(id, payload = {}) {
  ensureObjectId(id, 'product id')
  const existing = await Product.findById(id)
  if (!existing) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND)

  let input = normalizeProductInput(payload)
  if (input.category) await ensureCategoryExists(input.category)

  const needsBrandResolve =
    input.brandId !== undefined || input.deviceId !== undefined || input.brand !== undefined

  if (needsBrandResolve) {
    const merged = {
      category: input.category || existing.category,
      brandId: input.brandId !== undefined ? input.brandId : existing.brandId,
      deviceId: input.deviceId !== undefined ? input.deviceId : existing.deviceId,
      brand: input.brand !== undefined ? input.brand : existing.brand,
    }
    const resolved = await resolveBrandAndDevice(merged)
    input.brandId = resolved.brandId
    input.deviceId = resolved.deviceId
    input.brand = resolved.brand
  }

  Object.keys(input).forEach((key) => input[key] === undefined && delete input[key])

  const updated = await Product.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true })
  if (!updated) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND)
  return getProductById(updated._id)
}

export async function deleteProduct(id) {
  ensureObjectId(id, 'product id')
  const deleted = await Product.findByIdAndDelete(id)
  if (!deleted) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND)
  return { success: true }
}
