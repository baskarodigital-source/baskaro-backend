import mongoose from 'mongoose'
import { FlashDeal } from '../models/FlashDeal.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { formatPaginationResponse } from '../utils/helpers.js'
import { persistImageToCloudinary } from '../utils/persistImageToCloudinary.js'

function validatePrices(mrpInr, salePriceInr) {
  const mrp = Number(mrpInr)
  const sale = Number(salePriceInr)
  if (!Number.isFinite(mrp) || !Number.isFinite(sale)) {
    throw new AppError('mrpInr and salePriceInr must be numbers', 400, errorCodes.BAD_REQUEST)
  }
  if (sale > mrp) {
    throw new AppError('salePriceInr cannot be greater than mrpInr', 400, errorCodes.BAD_REQUEST)
  }
}

export async function listActiveFlashDeals() {
  return FlashDeal.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean()
}

export async function listAllFlashDeals({ page = 1, limit = 50 }) {
  const p = Math.max(1, parseInt(page, 10) || 1)
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
  const skip = (p - 1) * l
  const [items, total] = await Promise.all([
    FlashDeal.find({}).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(l).lean(),
    FlashDeal.countDocuments({}),
  ])
  return formatPaginationResponse(items, total, p, l)
}

export async function getFlashDealById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid flash deal id', 400, errorCodes.BAD_REQUEST)
  }
  const deal = await FlashDeal.findById(id).lean()
  if (!deal) throw new AppError('Flash deal not found', 404, errorCodes.NOT_FOUND)
  return deal
}

export async function createFlashDeal(body) {
  const { title, imageUrl, mrpInr, salePriceInr, sortOrder = 0, isActive = true, linkUrl = '' } = body
  validatePrices(mrpInr, salePriceInr)
  const storedImage = await persistImageToCloudinary(
    String(imageUrl).trim(),
    CLOUDINARY_FOLDERS.flashDeals,
  )
  const deal = await FlashDeal.create({
    title: String(title).trim(),
    imageUrl: storedImage,
    mrpInr: Number(mrpInr),
    salePriceInr: Number(salePriceInr),
    sortOrder: Number(sortOrder) || 0,
    isActive: Boolean(isActive),
    linkUrl: String(linkUrl || '').trim(),
  })
  return deal.toObject()
}

export async function updateFlashDeal(id, body) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid flash deal id', 400, errorCodes.BAD_REQUEST)
  }
  const existing = await FlashDeal.findById(id)
  if (!existing) throw new AppError('Flash deal not found', 404, errorCodes.NOT_FOUND)

  const mrp = body.mrpInr != null ? Number(body.mrpInr) : existing.mrpInr
  const sale = body.salePriceInr != null ? Number(body.salePriceInr) : existing.salePriceInr
  validatePrices(mrp, sale)

  const update = {}
  if (body.title != null) update.title = String(body.title).trim()
  if (body.imageUrl != null) {
    const raw = String(body.imageUrl).trim()
    update.imageUrl = raw
      ? await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.flashDeals)
      : ''
  }
  if (body.mrpInr != null) update.mrpInr = mrp
  if (body.salePriceInr != null) update.salePriceInr = sale
  if (body.sortOrder != null) update.sortOrder = Number(body.sortOrder)
  if (body.isActive != null) update.isActive = Boolean(body.isActive)
  if (body.linkUrl != null) update.linkUrl = String(body.linkUrl).trim()

  const updated = await FlashDeal.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
  return updated
}

export async function deleteFlashDeal(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid flash deal id', 400, errorCodes.BAD_REQUEST)
  }
  const deleted = await FlashDeal.findByIdAndDelete(id)
  if (!deleted) throw new AppError('Flash deal not found', 404, errorCodes.NOT_FOUND)
  return { success: true }
}
