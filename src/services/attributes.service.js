import mongoose from 'mongoose'
import { AppError, errorCodes } from '../utils/errorHandler.js'

import * as AttributeModelModule from '../models/Attribute.js'
import * as CategoryModelModule from '../models/Category.js'

const Attribute =
  AttributeModelModule.Attribute || AttributeModelModule.default || AttributeModelModule
const Category = CategoryModelModule.Category || CategoryModelModule.default || CategoryModelModule

function ensureObjectId(id, fieldName = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400, errorCodes.BAD_REQUEST)
  }
}

async function validateCategoryIds(categoryIds = []) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new AppError('categories must contain at least one id', 400, errorCodes.BAD_REQUEST)
  }
  categoryIds.forEach((id) => ensureObjectId(id, 'category id'))
  const count = await Category.countDocuments({ _id: { $in: categoryIds } })
  if (count !== categoryIds.length) {
    throw new AppError('One or more categories not found', 404, errorCodes.NOT_FOUND)
  }
}

function slugifyCode(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveAttributeCode(payload = {}, fallbackName = '') {
  const raw = payload.code != null ? String(payload.code).trim() : ''
  if (raw) return slugifyCode(raw)
  const name = String(payload.name || fallbackName || '').trim()
  return slugifyCode(name)
}

async function ensureAttributeIndexes() {
  await Attribute.collection.dropIndex('code_1').catch(() => {})
  await Attribute.syncIndexes().catch(() => {})
}

async function assertCodeUniqueForCategories(code, categoryIds = [], excludeId = null) {
  const normalized = slugifyCode(code)
  if (!normalized || !categoryIds.length) return normalized

  const query = {
    code: normalized,
    categories: { $in: categoryIds },
  }
  if (excludeId) query._id = { $ne: excludeId }

  const conflict = await Attribute.findOne(query).select('name code').lean()
  if (conflict) {
    throw new AppError(
      `An attribute with code "${normalized}" already exists for one of the selected categories`,
      409,
      errorCodes.CONFLICT,
    )
  }
  return normalized
}

export async function listAttributes({ includeInactive = false, categoryId } = {}) {
  await ensureAttributeIndexes()
  const query = includeInactive ? {} : { isActive: true }
  if (categoryId) {
    ensureObjectId(categoryId, 'category id')
    query.categories = categoryId
  }
  return Attribute.find(query).sort({ sortOrder: 1, name: 1, createdAt: 1 }).lean()
}

export async function createAttribute(payload = {}) {
  const name = String(payload.name || '').trim()
  if (!name) throw new AppError('name is required', 400, errorCodes.BAD_REQUEST)
  const categories = Array.isArray(payload.categories) ? payload.categories : []
  await validateCategoryIds(categories)
  await ensureAttributeIndexes()

  const code = await assertCodeUniqueForCategories(resolveAttributeCode(payload), categories)

  const doc = await Attribute.create({
    name,
    code: code || undefined,
    type: payload.type || 'select',
    categories,
    values: Array.isArray(payload.values) ? payload.values : [],
    isRequired: Boolean(payload.isRequired),
    isVariantAxis: Boolean(payload.isVariantAxis),
    useInFilter: payload.useInFilter !== false,
    showOnProduct: payload.showOnProduct !== false,
    sortOrder: Number(payload.sortOrder) || 0,
    isActive: payload.isActive !== false,
  })
  return doc.toObject()
}

export async function updateAttribute(id, payload = {}) {
  ensureObjectId(id, 'attribute id')
  await ensureAttributeIndexes()
  const existing = await Attribute.findById(id)
  if (!existing) throw new AppError('Attribute not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (payload.name != null) update.name = String(payload.name).trim()
  if (payload.type != null) update.type = payload.type
  if (payload.values != null) update.values = Array.isArray(payload.values) ? payload.values : []
  if (payload.isRequired != null) update.isRequired = Boolean(payload.isRequired)
  if (payload.isVariantAxis != null) update.isVariantAxis = Boolean(payload.isVariantAxis)
  if (payload.useInFilter != null) update.useInFilter = Boolean(payload.useInFilter)
  if (payload.showOnProduct != null) update.showOnProduct = Boolean(payload.showOnProduct)
  if (payload.sortOrder != null) update.sortOrder = Number(payload.sortOrder) || 0
  if (payload.isActive != null) update.isActive = Boolean(payload.isActive)
  if (payload.categories != null) {
    const categories = Array.isArray(payload.categories) ? payload.categories : []
    await validateCategoryIds(categories)
    update.categories = categories
  }

  const nextCategories = update.categories || existing.categories.map((id) => String(id))
  const nextCode = resolveAttributeCode(
    {
      code: payload.code != null ? payload.code : existing.code,
      name: payload.name != null ? payload.name : existing.name,
    },
    existing.name,
  )
  await assertCodeUniqueForCategories(nextCode, nextCategories, id)
  if (nextCode) update.code = nextCode

  const updated = await Attribute.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
  if (!updated) throw new AppError('Attribute not found', 404, errorCodes.NOT_FOUND)
  return updated.toObject()
}

export async function deleteAttribute(id) {
  ensureObjectId(id, 'attribute id')
  const deleted = await Attribute.findByIdAndDelete(id)
  if (!deleted) throw new AppError('Attribute not found', 404, errorCodes.NOT_FOUND)
  return { success: true }
}
