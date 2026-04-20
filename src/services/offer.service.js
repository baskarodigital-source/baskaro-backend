import mongoose from 'mongoose'
import { Offer } from '../models/Offer.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { formatPaginationResponse } from '../utils/helpers.js'

function normalizeCode(code) {
  const c = String(code || '').trim()
  return c ? c.toUpperCase() : ''
}

function normalizeModelId(modelId) {
  if (!modelId) return null
  const s = String(modelId).trim()
  if (!s) return null
  if (!mongoose.Types.ObjectId.isValid(s)) {
    throw new AppError('Invalid modelId', 400, errorCodes.BAD_REQUEST)
  }
  return new mongoose.Types.ObjectId(s)
}

export async function listActiveOffers({ modelId } = {}) {
  const mId = normalizeModelId(modelId)
  const q = { isActive: true }
  if (mId) q.$or = [{ modelId: null }, { modelId: mId }]
  return Offer.find(q).sort({ sortOrder: 1, createdAt: -1 }).lean()
}

export async function listAllOffers({ page = 1, limit = 100, modelId = '' } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1)
  const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 100))
  const skip = (p - 1) * l
  const mId = modelId ? normalizeModelId(modelId) : null
  const q = {}
  if (mId) q.modelId = mId

  const [items, total] = await Promise.all([
    Offer.find(q).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(l).lean(),
    Offer.countDocuments(q),
  ])
  return formatPaginationResponse(items, total, p, l)
}

export async function getOfferById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid offer id', 400, errorCodes.BAD_REQUEST)
  }
  const doc = await Offer.findById(id).lean()
  if (!doc) throw new AppError('Offer not found', 404, errorCodes.NOT_FOUND)
  return doc
}

export async function createOffer(body) {
  const title = String(body?.title || '').trim()
  const desc = String(body?.desc || '').trim()
  if (!title) throw new AppError('title is required', 400, errorCodes.BAD_REQUEST)
  if (!desc) throw new AppError('desc is required', 400, errorCodes.BAD_REQUEST)

  const created = await Offer.create({
    title,
    desc,
    code: normalizeCode(body?.code),
    modelId: normalizeModelId(body?.modelId),
    sortOrder: Number(body?.sortOrder) || 0,
    isActive: body?.isActive !== false,
  })
  return created.toObject()
}

export async function updateOffer(id, body) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid offer id', 400, errorCodes.BAD_REQUEST)
  }
  const existing = await Offer.findById(id)
  if (!existing) throw new AppError('Offer not found', 404, errorCodes.NOT_FOUND)

  const update = {}
  if (body.title != null) update.title = String(body.title).trim()
  if (body.desc != null) update.desc = String(body.desc).trim()
  if (body.code !== undefined) update.code = normalizeCode(body.code)
  if (body.modelId !== undefined) update.modelId = normalizeModelId(body.modelId)
  if (body.sortOrder != null) update.sortOrder = Number(body.sortOrder) || 0
  if (body.isActive != null) update.isActive = Boolean(body.isActive)

  const updated = await Offer.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean()
  return updated
}

export async function deleteOffer(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid offer id', 400, errorCodes.BAD_REQUEST)
  }
  const deleted = await Offer.findByIdAndDelete(id)
  if (!deleted) throw new AppError('Offer not found', 404, errorCodes.NOT_FOUND)
  return { success: true }
}

