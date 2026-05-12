import mongoose from 'mongoose'
import { HomeService } from '../models/HomeService.js'
import { DEFAULT_HOME_SERVICES } from '../constants/defaultHomeServices.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { formatPaginationResponse } from '../utils/helpers.js'

/** One-time move from legacy `homeservices` collection → `services`. */
async function migrateLegacyHomeServicesIfNeeded() {
  if ((await HomeService.countDocuments({})) > 0) return
  const db = mongoose.connection.db
  const legacy = 'homeservices'
  const cols = await db.listCollections({ name: legacy }).toArray()
  if (!cols.length) return
  const raw = await db.collection(legacy).find({}).toArray()
  if (!raw.length) return
  const payload = raw.map((d) => ({
    _id: d._id,
    label: d.label,
    path: d.path,
    imageUrl: d.imageUrl ?? '',
    sortOrder: d.sortOrder ?? 0,
    isActive: d.isActive !== false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }))
  try {
    await HomeService.insertMany(payload)
  } catch {
    /* ignore duplicate / validation races */
  }
}

async function ensureDefaultHomeServicesIfEmpty() {
  await migrateLegacyHomeServicesIfNeeded()
  const count = await HomeService.countDocuments({})
  if (count > 0) return
  try {
    await HomeService.insertMany(
      DEFAULT_HOME_SERVICES.map((s) => ({
        label: s.label,
        path: s.path,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
        isActive: true,
      })),
    )
  } catch {
    /* ignore race on first concurrent requests */
  }
}

export async function listActiveServices() {
  await ensureDefaultHomeServicesIfEmpty()
  return HomeService.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
}

export async function listAllServices({ page = 1, limit = 100 }) {
  const p = Math.max(1, parseInt(page, 10) || 1)
  const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 100))
  const skip = (p - 1) * l
  const [items, total] = await Promise.all([
    HomeService.find({}).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(l).lean(),
    HomeService.countDocuments({}),
  ])
  return formatPaginationResponse(items, total, p, l)
}

export async function createService(body) {
  const label = String(body?.label || '').trim()
  const path = String(body?.path || '').trim()
  const imageUrl = String(body?.imageUrl || '').trim()
  if (!label) throw new AppError('label is required', 400, errorCodes.BAD_REQUEST)
  if (!path) throw new AppError('path is required', 400, errorCodes.BAD_REQUEST)
  const created = await HomeService.create({
    label,
    path,
    imageUrl,
    sortOrder: Number(body?.sortOrder) || 0,
    isActive: body?.isActive !== false,
  })
  return created.toObject()
}

export async function updateService(id, body) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid service id', 400, errorCodes.BAD_REQUEST)
  }
  const existing = await HomeService.findById(id)
  if (!existing) throw new AppError('Service not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (body.label != null) update.label = String(body.label).trim()
  if (body.path != null) update.path = String(body.path).trim()
  if (body.imageUrl != null) update.imageUrl = String(body.imageUrl).trim()
  if (body.sortOrder != null) update.sortOrder = Number(body.sortOrder) || 0
  if (body.isActive != null) update.isActive = Boolean(body.isActive)

  const updated = await HomeService.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
  return updated
}

export async function deleteService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid service id', 400, errorCodes.BAD_REQUEST)
  }
  const deleted = await HomeService.findByIdAndDelete(id)
  if (!deleted) throw new AppError('Service not found', 404, errorCodes.NOT_FOUND)
  return { success: true }
}

