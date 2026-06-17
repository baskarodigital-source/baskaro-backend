import mongoose from 'mongoose'

function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueCategorySlug(Category, base, excludeId = null) {
  const rootSlug = slugify(base)
  if (!rootSlug) return rootSlug
  let attempt = rootSlug
  let n = 2
  while (true) {
    const query = { slug: attempt }
    if (excludeId) query._id = { $ne: excludeId }
    const exists = await Category.findOne(query).select('_id').lean()
    if (!exists) return attempt
    attempt = `${rootSlug}-${n++}`
  }
}

function ribbonToCatalogFields(ribbon) {
  return {
    name: String(ribbon.label || '').trim(),
    icon: ribbon.iconKey || null,
    image: ribbon.imageUrl || null,
    sortOrder: Number(ribbon.sortOrder) || 0,
    isActive: ribbon.isActive !== false,
    ribbonCategoryId: ribbon._id,
  }
}

function resolveRibbonIconKey(icon) {
  const RIBBON_ICON_KEYS = [
    'smartphone',
    'watch',
    'tv',
    'wind',
    'laptop',
    'sparkles',
    'headphones',
    'tablet',
    'gift',
    'cpu',
  ]
  const key = String(icon || '').trim().toLowerCase()
  return RIBBON_ICON_KEYS.includes(key) ? key : 'smartphone'
}

function catalogToRibbonFields(catalog) {
  return {
    label: String(catalog.name || '').trim(),
    path: '/marketplace',
    iconKey: resolveRibbonIconKey(catalog.icon),
    imageUrl: catalog.image || '',
    sortOrder: Number(catalog.sortOrder) || 0,
    isActive: catalog.isActive !== false,
    catalogCategoryId: catalog._id,
  }
}

export async function linkRibbonAndCatalog(ribbonId, catalogId) {
  const { RibbonCategory } = await import('../models/RibbonCategory.js')
  const { Category } = await import('../models/Category.js')
  if (!mongoose.Types.ObjectId.isValid(ribbonId) || !mongoose.Types.ObjectId.isValid(catalogId)) {
    return null
  }
  await RibbonCategory.findByIdAndUpdate(ribbonId, { $set: { catalogCategoryId: catalogId } })
  await Category.findByIdAndUpdate(catalogId, { $set: { ribbonCategoryId: ribbonId } })
  return { ribbonId: String(ribbonId), catalogId: String(catalogId) }
}

export async function syncRibbonToCatalog(ribbonId) {
  const { RibbonCategory } = await import('../models/RibbonCategory.js')
  const { Category } = await import('../models/Category.js')

  const ribbon = await RibbonCategory.findById(ribbonId).lean()
  if (!ribbon) return null

  const fields = ribbonToCatalogFields(ribbon)
  if (!fields.name) return null

  let catalog =
    (ribbon.catalogCategoryId ? await Category.findById(ribbon.catalogCategoryId) : null) ||
    (await Category.findOne({ ribbonCategoryId: ribbon._id })) ||
    (await Category.findOne({ slug: slugify(ribbon.label) }))

  if (catalog) {
    catalog = await Category.findByIdAndUpdate(
      catalog._id,
      { $set: fields },
      { new: true, runValidators: true },
    )
  } else {
    const slug = await uniqueCategorySlug(Category, fields.name)
    catalog = await Category.create({ ...fields, slug, parent: null, ancestors: [] })
  }

  await RibbonCategory.findByIdAndUpdate(ribbon._id, { $set: { catalogCategoryId: catalog._id } })
  return catalog.toObject()
}

export async function syncCatalogToRibbon(catalogId) {
  const { RibbonCategory } = await import('../models/RibbonCategory.js')
  const { Category } = await import('../models/Category.js')

  const catalog = await Category.findById(catalogId).lean()
  if (!catalog) return null

  const name = String(catalog.name || '').trim()
  if (!name) return null

  // All Categories only lists top-level ribbon cards (no nested parents).
  if (catalog.parent) return null

  const fields = catalogToRibbonFields(catalog)

  let ribbon =
    (catalog.ribbonCategoryId ? await RibbonCategory.findById(catalog.ribbonCategoryId) : null) ||
    (await RibbonCategory.findOne({ catalogCategoryId: catalog._id }))

  if (ribbon) {
    ribbon = await RibbonCategory.findByIdAndUpdate(
      ribbon._id,
      { $set: fields },
      { new: true, runValidators: true },
    )
  } else {
    ribbon = await RibbonCategory.create(fields)
  }

  await Category.findByIdAndUpdate(catalog._id, { $set: { ribbonCategoryId: ribbon._id } })
  return ribbon.toObject()
}

/** Push unlinked root catalog categories into All Categories (ribbon). */
export async function syncOrphanCatalogCategoriesToRibbon() {
  const { RibbonCategory } = await import('../models/RibbonCategory.js')
  const { Category } = await import('../models/Category.js')

  const roots = await Category.find({ parent: null }).sort({ sortOrder: 1, name: 1 }).lean()
  const created = []
  const linked = []

  for (const catalog of roots) {
    const hasRibbonLink =
      Boolean(catalog.ribbonCategoryId) ||
      Boolean(await RibbonCategory.findOne({ catalogCategoryId: catalog._id }).select('_id').lean())

    const ribbon = await syncCatalogToRibbon(catalog._id)
    if (!ribbon) continue

    if (hasRibbonLink) linked.push(ribbon)
    else created.push(ribbon)
  }

  return { created: created.length, linked: linked.length, items: [...created, ...linked] }
}

export async function syncAllRibbonCatalogLinks() {
  const { RibbonCategory } = await import('../models/RibbonCategory.js')
  const { Category } = await import('../models/Category.js')

  const ribbons = await RibbonCategory.find({}).sort({ sortOrder: 1, label: 1 }).lean()
  const created = []
  const linked = []
  const skipped = []

  for (const ribbon of ribbons) {
    const name = String(ribbon.label || '').trim()
    if (!name) {
      skipped.push({ ribbonId: ribbon._id, reason: 'empty label' })
      continue
    }

    const hadCatalog =
      Boolean(ribbon.catalogCategoryId) ||
      Boolean(await Category.findOne({ ribbonCategoryId: ribbon._id }).select('_id').lean())

    const catalog = await syncRibbonToCatalog(ribbon._id)
    if (!catalog) {
      skipped.push({ ribbonId: ribbon._id, reason: 'sync failed' })
      continue
    }

    if (hadCatalog) linked.push(catalog)
    else created.push(catalog)
  }

  const orphanSync = await syncOrphanCatalogCategoriesToRibbon()

  return {
    created: created.length,
    linked: linked.length,
    skipped: skipped.length,
    items: [...created, ...linked],
    skippedItems: skipped,
    ribbonCreated: orphanSync.created,
    ribbonLinked: orphanSync.linked,
    ribbonItems: orphanSync.items,
  }
}
