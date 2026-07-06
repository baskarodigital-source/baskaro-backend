import { StoreLocation } from '../models/StoreLocation.js'
import { DEFAULT_STORE_CITIES, DEFAULT_STORE_LOCATIONS } from '../constants/defaultStoreLocations.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination } from '../utils/helpers.js'
import { persistImageToCloudinary } from '../utils/persistImageToCloudinary.js'

async function ensureDefaultStoreLocations() {
  const count = await StoreLocation.countDocuments()
  if (count > 0) return
  try {
    await StoreLocation.insertMany(DEFAULT_STORE_LOCATIONS, { ordered: false })
  } catch {
    /* race on concurrent first requests */
  }
}

function canonicalCityName(city) {
  const trimmed = String(city || '').trim()
  if (!trimmed) return ''
  const preferred = DEFAULT_STORE_CITIES.find((c) => c.toLowerCase() === trimmed.toLowerCase())
  return preferred || trimmed
}

async function getStoreCities() {
  const fromDb = await StoreLocation.distinct('city')
  const merged = [...DEFAULT_STORE_CITIES, ...fromDb.map((c) => canonicalCityName(c)).filter(Boolean)]
  const canonical = new Map()
  for (const city of merged) {
    const key = city.toLowerCase()
    if (!key || canonical.has(key)) continue
    canonical.set(key, city)
  }
  return [...canonical.values()].sort((a, b) => a.localeCompare(b))
}

function normalizeStoreKey(name, city, address) {
  return [name, city, address].map((s) => String(s || '').trim().toLowerCase()).join('|')
}

async function findDuplicateStore({ name, city, address, excludeId }) {
  const key = normalizeStoreKey(name, city, address)
  const filter = excludeId ? { _id: { $ne: excludeId } } : {}
  const docs = await StoreLocation.find(filter).lean()
  return docs.find((d) => normalizeStoreKey(d.name, d.city, d.address) === key) || null
}

function normalizeStorePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function parseStorePhone(phone) {
  const digits = normalizeStorePhone(phone)
  if (!digits) return ''
  if (digits.length !== 10) {
    throw new AppError('Phone must be exactly 10 digits', 400, errorCodes.BAD_REQUEST)
  }
  return digits
}

function mapPublicStore(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    city: canonicalCityName(doc.city),
    address: doc.address || '',
    imageUrl: doc.imageUrl || '',
    phone: doc.phone || '',
  }
}

export async function listPublicStores({ city = '' } = {}) {
  await ensureDefaultStoreLocations()
  const query = { isActive: true }
  const cityFilter = canonicalCityName(city)
  if (cityFilter) query.city = new RegExp(`^${cityFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  const items = await StoreLocation.find(query).sort({ createdAt: -1 }).lean()
  const cities = await getStoreCities()
  return {
    cities,
    stores: items.map(mapPublicStore),
  }
}

export async function listAllStoresAdmin({ page = 1, limit = 100 } = {}) {
  await ensureDefaultStoreLocations()
  const { skip, limit: lim, page: pg } = getPagination(page, limit)
  const [items, total] = await Promise.all([
    StoreLocation.find().sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    StoreLocation.countDocuments(),
  ])
  const cities = await getStoreCities()
  return { items, total, page: pg, limit: lim, cities }
}

export async function createStoresBulkAdmin(stores = []) {
  if (!Array.isArray(stores) || stores.length === 0) {
    throw new AppError('At least one store is required', 400, errorCodes.BAD_REQUEST)
  }
  const created = []
  for (const row of stores) {
    const doc = await createStoreAdmin(row)
    created.push(doc)
  }
  return created
}

export async function createStoreAdmin(data) {
  const name = String(data?.name || '').trim()
  if (!name) throw new AppError('Store name is required', 400, errorCodes.BAD_REQUEST)
  const city = canonicalCityName(data?.city)
  const address = String(data?.address || '').trim()
  const duplicate = await findDuplicateStore({ name, city, address })
  if (duplicate) {
    throw new AppError('A store with the same name, city, and address already exists', 409, errorCodes.CONFLICT)
  }
  const rawImage = String(data?.imageUrl || '').trim()
  const imageUrl = rawImage ? await persistImageToCloudinary(rawImage, CLOUDINARY_FOLDERS.cms) : ''
  return StoreLocation.create({
    name,
    city,
    address,
    imageUrl,
    phone: parseStorePhone(data?.phone),
    isActive: data?.isActive !== false,
  })
}

export async function updateStoreAdmin(id, data) {
  const existing = await StoreLocation.findById(id).lean()
  if (!existing) throw new AppError('Store not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (data?.name !== undefined) {
    const name = String(data.name || '').trim()
    if (!name) throw new AppError('Store name is required', 400, errorCodes.BAD_REQUEST)
    update.name = name
  }
  if (data?.city !== undefined) update.city = canonicalCityName(data.city)
  if (data?.address !== undefined) update.address = String(data.address || '').trim()
  if (data?.name !== undefined || data?.city !== undefined || data?.address !== undefined) {
    const duplicate = await findDuplicateStore({
      name: update.name ?? existing.name,
      city: update.city ?? existing.city,
      address: update.address ?? existing.address,
      excludeId: id,
    })
    if (duplicate) {
      throw new AppError('A store with the same name, city, and address already exists', 409, errorCodes.CONFLICT)
    }
  }
  if (data?.phone !== undefined) update.phone = parseStorePhone(data.phone)
  if (data?.isActive !== undefined) update.isActive = Boolean(data.isActive)
  if (data?.imageUrl !== undefined) {
    const raw = String(data.imageUrl || '').trim()
    update.imageUrl = raw ? await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.cms) : ''
  }
  const store = await StoreLocation.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  if (!store) throw new AppError('Store not found', 404, errorCodes.NOT_FOUND)
  return store
}

export async function deleteStoreAdmin(id) {
  const store = await StoreLocation.findByIdAndDelete(id)
  if (!store) throw new AppError('Store not found', 404, errorCodes.NOT_FOUND)
  return { success: true, message: 'Store deleted successfully' }
}
