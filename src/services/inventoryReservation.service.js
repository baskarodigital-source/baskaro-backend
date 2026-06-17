import mongoose from 'mongoose'
import { Inventory } from '../models/Inventory.js'
import { RESERVATION_TTL_MS } from '../constants/inventoryReservation.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function toObjectId(id, label = 'id') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400, errorCodes.BAD_REQUEST)
  }
  return new mongoose.Types.ObjectId(id)
}

/** Clear holds that have expired. */
export async function releaseExpiredReservations() {
  const now = new Date()
  await Inventory.updateMany(
    { reservedUntil: { $lte: now }, isSold: false },
    { $unset: { reservedUntil: 1, reservedBy: 1 } },
  )
}

/**
 * Atomically reserve a pre-owned unit for a user.
 * @param {string} inventoryId
 * @param {string} userId
 * @param {number} [ttlMs]
 */
export async function reserveInventory(inventoryId, userId, ttlMs = RESERVATION_TTL_MS) {
  await releaseExpiredReservations()

  const id = toObjectId(inventoryId, 'inventoryId')
  const uid = toObjectId(userId, 'userId')
  const until = new Date(Date.now() + ttlMs)
  const now = new Date()

  const updated = await Inventory.findOneAndUpdate(
    {
      _id: id,
      isSold: false,
      stock: { $gt: 0 },
      $or: [
        { reservedUntil: { $exists: false } },
        { reservedUntil: null },
        { reservedUntil: { $lte: now } },
        { reservedBy: uid },
      ],
    },
    { $set: { reservedUntil: until, reservedBy: uid } },
    { new: true },
  )
    .populate('modelId', 'modelName slug image basePrice storageVariants')
    .populate('brandId', 'name slug')

  if (!updated) {
    throw new AppError('This device is no longer available', 409, errorCodes.CONFLICT)
  }

  return updated
}

/** Release a hold if it belongs to the user. */
export async function releaseReservation(inventoryId, userId) {
  const id = toObjectId(inventoryId, 'inventoryId')
  const uid = toObjectId(userId, 'userId')

  await Inventory.updateOne(
    { _id: id, reservedBy: uid, isSold: false },
    { $unset: { reservedUntil: 1, reservedBy: 1 } },
  )
}

/** Extend checkout hold for items in a buy order. */
export async function extendReservation(inventoryId, userId, ttlMs) {
  return reserveInventory(inventoryId, userId, ttlMs)
}

/** Mark unit sold and clear reservation after successful payment. */
export async function confirmInventorySale(inventoryId) {
  const id = toObjectId(inventoryId, 'inventoryId')
  const updated = await Inventory.findOneAndUpdate(
    { _id: id, isSold: false, stock: { $gt: 0 } },
    {
      $set: { isSold: true, soldAt: new Date(), stock: 0 },
      $unset: { reservedUntil: 1, reservedBy: 1 },
    },
    { new: true },
  )

  if (!updated) {
    throw new AppError('Inventory item could not be marked sold', 409, errorCodes.CONFLICT)
  }

  return updated
}

/** True when the unit is reserved by this user and the hold is still active. */
export function isReservedByUser(inventory, userId) {
  if (!inventory?.reservedBy || !inventory?.reservedUntil) return false
  if (String(inventory.reservedBy) !== String(userId)) return false
  return new Date(inventory.reservedUntil) > new Date()
}
