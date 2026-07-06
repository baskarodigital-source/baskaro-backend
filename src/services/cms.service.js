import { WebsitePage } from '../models/WebsitePage.js'
import { DEFAULT_WEBSITE_PAGES } from '../constants/defaultWebsitePagesConfig.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination } from '../utils/helpers.js'

function normalizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureDefaultPages() {
  await Promise.all(
    DEFAULT_WEBSITE_PAGES.map((page) =>
      WebsitePage.updateOne({ slug: page.slug }, { $setOnInsert: page }, { upsert: true }),
    ),
  )
}

/** Fill empty title/summary/body from defaults so admin shows previous placeholder content. */
async function backfillEmptyFromDefaults() {
  for (const def of DEFAULT_WEBSITE_PAGES) {
    const doc = await WebsitePage.findOne({ slug: def.slug })
    if (!doc) continue
    const update = {}
    if (!String(doc.title || '').trim() && def.title) update.title = def.title
    if (!String(doc.summary || '').trim() && def.summary) update.summary = def.summary
    if (!String(doc.body || '').trim() && def.body) update.body = def.body
    if (Object.keys(update).length) {
      await WebsitePage.updateOne({ _id: doc._id }, { $set: update })
    }
  }
}

async function removeLegacyDuplicateContactPage() {
  const canonical = await WebsitePage.findOne({ slug: 'contact' }).lean()
  if (!canonical) return
  await WebsitePage.deleteOne({ slug: 'contact-us' })
}

async function prepareCmsPages() {
  await ensureDefaultPages()
  await backfillEmptyFromDefaults()
  await removeLegacyDuplicateContactPage()
}

export async function listPublicPages() {
  await prepareCmsPages()
  const pages = await WebsitePage.find({ isPublished: true })
    .select('slug title summary updatedAt')
    .sort({ title: 1 })
    .lean()
  return pages
}

export async function getPublicPageBySlug(slugRaw) {
  await prepareCmsPages()
  const slug = normalizeSlug(slugRaw)
  if (!slug) throw new AppError('Page slug is required', 400, errorCodes.BAD_REQUEST)

  const page = await WebsitePage.findOne({ slug, isPublished: true }).lean()
  if (!page) throw new AppError('Page not found', 404, errorCodes.NOT_FOUND)
  return page
}

export async function listAllPagesAdmin({ page = 1, limit = 100 } = {}) {
  await prepareCmsPages()
  const { skip, limit: lim, page: pg } = getPagination(page, limit)
  const [items, total] = await Promise.all([
    WebsitePage.find().sort({ title: 1 }).skip(skip).limit(lim).lean(),
    WebsitePage.countDocuments(),
  ])
  return { items, total, page: pg, limit: lim }
}

export async function getAdminPageBySlug(slugRaw) {
  await prepareCmsPages()
  const slug = normalizeSlug(slugRaw)
  if (!slug) throw new AppError('Page slug is required', 400, errorCodes.BAD_REQUEST)
  const page = await WebsitePage.findOne({ slug }).lean()
  if (!page) throw new AppError('Page not found', 404, errorCodes.NOT_FOUND)
  return page
}

export async function getPageByIdAdmin(id) {
  const page = await WebsitePage.findById(id).lean()
  if (!page) throw new AppError('Page not found', 404, errorCodes.NOT_FOUND)
  return page
}

export async function createPageAdmin(data) {
  const slug = normalizeSlug(data?.slug)
  const title = String(data?.title || '').trim()
  if (!slug) throw new AppError('Slug is required', 400, errorCodes.BAD_REQUEST)
  if (!title) throw new AppError('Title is required', 400, errorCodes.BAD_REQUEST)

  const existing = await WebsitePage.findOne({ slug }).lean()
  if (existing) throw new AppError('A page with this slug already exists', 409, errorCodes.CONFLICT)

  const page = await WebsitePage.create({
    slug,
    title,
    summary: String(data?.summary || '').trim(),
    body: String(data?.body || ''),
    isPublished: data?.isPublished !== false,
  })
  return page
}

export async function updatePageAdmin(id, data) {
  const update = {}
  if (data?.slug !== undefined) {
    const slug = normalizeSlug(data.slug)
    if (!slug) throw new AppError('Slug is required', 400, errorCodes.BAD_REQUEST)
    const existing = await WebsitePage.findOne({ slug, _id: { $ne: id } }).lean()
    if (existing) throw new AppError('A page with this slug already exists', 409, errorCodes.CONFLICT)
    update.slug = slug
  }
  if (data?.title !== undefined) {
    const title = String(data.title || '').trim()
    if (!title) throw new AppError('Title is required', 400, errorCodes.BAD_REQUEST)
    update.title = title
  }
  if (data?.summary !== undefined) update.summary = String(data.summary || '').trim()
  if (data?.body !== undefined) update.body = String(data.body || '')
  if (data?.isPublished !== undefined) update.isPublished = Boolean(data.isPublished)

  const page = await WebsitePage.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  if (!page) throw new AppError('Page not found', 404, errorCodes.NOT_FOUND)
  return page
}

export async function deletePageAdmin(id) {
  const page = await WebsitePage.findByIdAndDelete(id)
  if (!page) throw new AppError('Page not found', 404, errorCodes.NOT_FOUND)
  return { success: true, message: 'Page deleted successfully' }
}
