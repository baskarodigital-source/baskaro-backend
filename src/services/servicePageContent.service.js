import { ServicePageContent } from '../models/ServicePageContent.js'
import { DEFAULT_REPAIR_WHY_US_ITEMS } from '../constants/defaultRepairWhyUs.js'
import { DEFAULT_SELL_PHONE_WHY_US_ITEMS } from '../constants/defaultSellPhoneWhyUs.js'
import { DEFAULT_NEARBY_STORES_SECTION_HEADINGS } from '../constants/defaultNearbyStoresSectionHeadings.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

export const CMS_PAGE_KEYS = [
  { key: 'repair-phone', label: 'Repair Phone' },
  { key: 'sell-phone', label: 'Sell Phone' },
  { key: 'nearby-stores', label: 'Nearby Stores' },
]

const SECTION_HEADING_DEFAULTS = {
  'nearby-stores': DEFAULT_NEARBY_STORES_SECTION_HEADINGS,
}

function normalizePageKey(pageKey) {
  return String(pageKey || '')
    .trim()
    .toLowerCase()
}

function sortWhyUs(items) {
  if (!Array.isArray(items)) return []
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

function normalizeWhyUsItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((row, index) => ({
      title: String(row?.title || '').trim(),
      description: String(row?.description || '').trim(),
      sortOrder: Number.isFinite(Number(row?.sortOrder)) ? Number(row.sortOrder) : (index + 1) * 10,
    }))
    .filter((row) => row.title && row.description)
}

function normalizeSectionHeadings(pageKey, raw = {}) {
  const defaults = SECTION_HEADING_DEFAULTS[pageKey] || {}
  const merged = { ...defaults }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return merged
  for (const [key, value] of Object.entries(raw)) {
    const text = String(value || '').trim()
    if (text && key in merged) merged[key] = text
  }
  return merged
}

function mapPublicDoc(doc) {
  const pageKey = doc.pageKey
  return {
    pageKey,
    whyUsItems: sortWhyUs(doc.whyUsItems),
    sectionHeadings: normalizeSectionHeadings(pageKey, doc.sectionHeadings),
  }
}

function mapAdminDoc(doc) {
  return {
    _id: doc._id,
    ...mapPublicDoc(doc),
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  }
}

async function seedPageIfMissing(key) {
  if (key === 'repair-phone' || key === 'sell-phone') {
    const seedItems = key === 'sell-phone' ? DEFAULT_SELL_PHONE_WHY_US_ITEMS : DEFAULT_REPAIR_WHY_US_ITEMS
    try {
      await ServicePageContent.create({ pageKey: key, whyUsItems: seedItems })
    } catch {
      /* race */
    }
    return
  }
  if (key === 'nearby-stores') {
    try {
      await ServicePageContent.create({
        pageKey: key,
        whyUsItems: [],
        sectionHeadings: DEFAULT_NEARBY_STORES_SECTION_HEADINGS,
      })
    } catch {
      /* race */
    }
  }
}

export async function getPublicByPageKey(pageKey) {
  const key = normalizePageKey(pageKey)
  if (!key) return { pageKey: '', whyUsItems: [], sectionHeadings: {} }

  let doc = await ServicePageContent.findOne({ pageKey: key }).lean()
  if (!doc) {
    await seedPageIfMissing(key)
    doc = await ServicePageContent.findOne({ pageKey: key }).lean()
  }
  if (!doc) {
    return {
      pageKey: key,
      whyUsItems: [],
      sectionHeadings: normalizeSectionHeadings(key),
    }
  }
  return mapPublicDoc(doc)
}

export async function listAllPages() {
  const docs = await ServicePageContent.find({}).sort({ pageKey: 1 }).lean()
  return docs.map((doc) => ({
    _id: doc._id,
    pageKey: doc.pageKey,
    whyUsItems: sortWhyUs(doc.whyUsItems),
    sectionHeadings: normalizeSectionHeadings(doc.pageKey, doc.sectionHeadings),
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  }))
}

export async function getAdminByPageKey(pageKey) {
  const key = normalizePageKey(pageKey)
  if (!key) throw new AppError('pageKey is required', 400, errorCodes.BAD_REQUEST)

  let doc = await ServicePageContent.findOne({ pageKey: key }).lean()
  if (!doc) {
    await seedPageIfMissing(key)
    doc = await ServicePageContent.findOne({ pageKey: key }).lean()
  }
  if (!doc) {
    return {
      pageKey: key,
      whyUsItems: [],
      sectionHeadings: normalizeSectionHeadings(key),
    }
  }
  return mapAdminDoc(doc)
}

export async function upsertPageContent(pageKey, body = {}) {
  const key = normalizePageKey(pageKey)
  if (!key) throw new AppError('pageKey is required', 400, errorCodes.BAD_REQUEST)

  const update = { pageKey: key }
  if (body.whyUsItems !== undefined) update.whyUsItems = normalizeWhyUsItems(body.whyUsItems)
  if (body.sectionHeadings !== undefined) update.sectionHeadings = normalizeSectionHeadings(key, body.sectionHeadings)

  const doc = await ServicePageContent.findOneAndUpdate(
    { pageKey: key },
    update,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean()
  return mapAdminDoc(doc)
}

export async function deletePageContent(pageKey) {
  const key = normalizePageKey(pageKey)
  if (!key) throw new AppError('pageKey is required', 400, errorCodes.BAD_REQUEST)
  const doc = await ServicePageContent.findOneAndDelete({ pageKey: key })
  if (!doc) throw new AppError('Page content not found', 404, errorCodes.NOT_FOUND)
  return { pageKey: key }
}
