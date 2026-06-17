import mongoose from 'mongoose'
import { AppError, errorCodes } from '../utils/errorHandler.js'

import * as CategoryModelModule from '../models/Category.js'

const Category =
  CategoryModelModule.Category || CategoryModelModule.default || CategoryModelModule

function ensureObjectId(id, fieldName = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400, errorCodes.BAD_REQUEST)
  }
}

async function ensureParentAndAncestors(parentId) {
  if (!parentId) return { parent: null, ancestors: [] }
  ensureObjectId(parentId, 'parent')
  const parentDoc = await Category.findById(parentId).select('_id ancestors').lean()
  if (!parentDoc) {
    throw new AppError('Parent category not found', 404, errorCodes.NOT_FOUND)
  }
  return {
    parent: parentDoc._id,
    ancestors: [...(parentDoc.ancestors || []), parentDoc._id],
  }
}

async function assertNoCycles(id, nextParentId) {
  if (!nextParentId) return
  if (String(id) === String(nextParentId)) {
    throw new AppError('A category cannot be parent of itself', 400, errorCodes.BAD_REQUEST)
  }
  const parent = await Category.findById(nextParentId).select('ancestors').lean()
  if (!parent) throw new AppError('Parent category not found', 404, errorCodes.NOT_FOUND)
  const cycle = (parent.ancestors || []).some((ancestor) => String(ancestor) === String(id))
  if (cycle) {
    throw new AppError(
      'Invalid move: parent cannot be a descendant of category',
      400,
      errorCodes.BAD_REQUEST,
    )
  }
}

async function refreshDescendantAncestors(rootId) {
  const queue = [String(rootId)]
  while (queue.length > 0) {
    const currentId = queue.shift()
    const current = await Category.findById(currentId).select('_id ancestors').lean()
    if (!current) continue

    const children = await Category.find({ parent: current._id }).select('_id').lean()
    if (!children.length) continue

    await Promise.all(
      children.map(async (child) => {
        const ancestors = [...(current.ancestors || []), current._id]
        await Category.findByIdAndUpdate(child._id, { $set: { ancestors } })
      }),
    )
    for (const child of children) queue.push(String(child._id))
  }
}

function buildTree(items) {
  const map = new Map()
  const roots = []
  for (const item of items) {
    map.set(String(item._id), { ...item, children: [] })
  }
  for (const item of map.values()) {
    if (item.parent && map.has(String(item.parent))) {
      map.get(String(item.parent)).children.push(item)
    } else {
      roots.push(item)
    }
  }
  return roots
}

export async function listCategories({ includeInactive = false, tree = false } = {}) {
  const query = includeInactive ? {} : { isActive: true }
  const items = await Category.find(query)
    .sort({ sortOrder: 1, name: 1, createdAt: 1 })
    .lean()
  if (!tree) return items
  return buildTree(items)
}

export async function createCategory(payload = {}) {
  const name = String(payload.name || '').trim()
  if (!name) throw new AppError('name is required', 400, errorCodes.BAD_REQUEST)

  const { parent, ancestors } = await ensureParentAndAncestors(payload.parent || null)
  const doc = await Category.create({
    name,
    slug: payload.slug ? String(payload.slug).trim() : undefined,
    parent,
    ancestors,
    icon: payload.icon != null ? String(payload.icon).trim() : null,
    image: payload.image != null ? String(payload.image).trim() : null,
    seo: payload.seo || {},
    sortOrder: Number(payload.sortOrder) || 0,
    isActive: payload.isActive !== false,
  })

  if (!parent) {
    const { syncCatalogToRibbon } = await import('./catalogRibbonLink.service.js')
    await syncCatalogToRibbon(doc._id).catch(() => {})
    const linked = await Category.findById(doc._id).lean()
    return linked || doc.toObject()
  }

  return doc.toObject()
}

export async function updateCategory(id, payload = {}) {
  ensureObjectId(id, 'category id')
  const existing = await Category.findById(id)
  if (!existing) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (payload.name != null) update.name = String(payload.name).trim()
  if (payload.slug != null) update.slug = String(payload.slug).trim()
  if (payload.icon != null) update.icon = String(payload.icon).trim()
  if (payload.image != null) update.image = String(payload.image).trim()
  if (payload.seo != null) update.seo = payload.seo
  if (payload.sortOrder != null) update.sortOrder = Number(payload.sortOrder) || 0
  if (payload.isActive != null) update.isActive = Boolean(payload.isActive)

  if (payload.parent !== undefined) {
    const nextParent = payload.parent || null
    if (nextParent) ensureObjectId(nextParent, 'parent')
    await assertNoCycles(id, nextParent)
    const { parent, ancestors } = await ensureParentAndAncestors(nextParent)
    update.parent = parent
    update.ancestors = ancestors
  }

  const updated = await Category.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
  if (!updated) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND)

  if (payload.parent !== undefined) {
    await refreshDescendantAncestors(id)
  }

  const result = updated.toObject()
  if (!result.parent) {
    const { syncCatalogToRibbon } = await import('./catalogRibbonLink.service.js')
    await syncCatalogToRibbon(result._id).catch(() => {})
    const linked = await Category.findById(result._id).lean()
    return linked || result
  }

  return result
}

export async function deleteCategory(id) {
  ensureObjectId(id, 'category id')
  const existing = await Category.findById(id).lean()
  if (!existing) throw new AppError('Category not found', 404, errorCodes.NOT_FOUND)

  const children = await Category.find({ parent: id }).select('_id').lean()
  if (children.length) {
    throw new AppError(
      'Cannot delete category with children. Reassign or delete child categories first.',
      400,
      errorCodes.BAD_REQUEST,
    )
  }

  await Category.findByIdAndDelete(id)
  return { success: true }
}

function slugifyName(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueCategorySlug(base) {
  const rootSlug = slugifyName(base)
  if (!rootSlug) return rootSlug
  let attempt = rootSlug
  let n = 2
  while (await Category.findOne({ slug: attempt }).select('_id').lean()) {
    attempt = `${rootSlug}-${n++}`
  }
  return attempt
}

export async function importFromRibbonCategories() {
  const { syncAllRibbonCatalogLinks } = await import('./catalogRibbonLink.service.js')
  return syncAllRibbonCatalogLinks()
}

export async function getCategoryByRibbonId(ribbonId) {
  if (!mongoose.Types.ObjectId.isValid(ribbonId)) {
    throw new AppError('Invalid ribbon category id', 400, errorCodes.BAD_REQUEST)
  }
  const category = await Category.findOne({ ribbonCategoryId: ribbonId }).lean()
  if (!category) return null
  return category
}

