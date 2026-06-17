import mongoose from 'mongoose'
import { Cart } from '../models/Cart.js'
import { Inventory } from '../models/Inventory.js'
import {
  isReservedByUser,
  releaseReservation,
  reserveInventory,
} from './inventoryReservation.service.js'
import { mapPublicInventory } from '../utils/mapPublicInventory.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

function buildLineTitle(inventory) {
  const brand = String(inventory.brandId?.name || '').trim()
  const model = String(inventory.modelId?.modelName || '').trim()
  return `${brand} ${model}`.trim() || 'Pre-Owned Device'
}

function pickImage(inventory) {
  const imgs = Array.isArray(inventory.images) ? inventory.images : []
  if (imgs[0]) return String(imgs[0])
  return String(inventory.modelId?.image || '')
}

function mapCartItem(item, viewerUserId) {
  return {
    inventoryId: String(item.inventoryId),
    quantity: item.quantity,
    unitPriceInr: item.unitPriceInr,
    title: item.title,
    imageUrl: item.imageUrl,
    conditionGrade: item.conditionGrade,
    reservedUntil: item.reservedUntil,
    id: String(item.inventoryId),
    name: item.title,
    price: String(item.unitPriceInr),
    img: item.imageUrl,
    reservedByYou: item.reservedUntil && new Date(item.reservedUntil) > new Date(),
    viewerUserId,
  }
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId })
  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
  }
  return cart
}

export async function getCartForUser(userId) {
  const cart = await getOrCreateCart(userId)
  const items = (cart.items || []).map((item) => mapCartItem(item, userId))
  const subtotalInr = items.reduce((sum, i) => sum + i.unitPriceInr * i.quantity, 0)
  return {
    items,
    subtotalInr,
    itemCount: items.length,
  }
}

export async function addInventoryToCart(userId, inventoryId) {
  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new AppError('Invalid inventoryId', 400, errorCodes.BAD_REQUEST)
  }

  const cart = await getOrCreateCart(userId)
  const existing = cart.items.find((i) => String(i.inventoryId) === String(inventoryId))
  if (existing) {
    return getCartForUser(userId)
  }

  const inventory = await reserveInventory(inventoryId, userId)
  const line = {
    inventoryId: inventory._id,
    quantity: 1,
    unitPriceInr: Math.round(Number(inventory.price) || 0),
    title: buildLineTitle(inventory),
    imageUrl: pickImage(inventory),
    conditionGrade: inventory.conditionGrade,
    reservedUntil: inventory.reservedUntil,
  }

  cart.items.push(line)
  await cart.save()

  return getCartForUser(userId)
}

export async function removeInventoryFromCart(userId, inventoryId) {
  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new AppError('Invalid inventoryId', 400, errorCodes.BAD_REQUEST)
  }

  const cart = await Cart.findOne({ userId })
  if (!cart) return getCartForUser(userId)

  cart.items = cart.items.filter((i) => String(i.inventoryId) !== String(inventoryId))
  await cart.save()
  await releaseReservation(inventoryId, userId)

  return getCartForUser(userId)
}

export async function clearCartForUser(userId) {
  const cart = await Cart.findOne({ userId })
  if (!cart) return { items: [], subtotalInr: 0, itemCount: 0 }

  for (const item of cart.items) {
    await releaseReservation(item.inventoryId, userId)
  }

  cart.items = []
  await cart.save()
  return getCartForUser(userId)
}

/** Validate every cart line is still held by this user. */
export async function assertCartReservations(userId) {
  const cart = await getOrCreateCart(userId)
  if (!cart.items.length) {
    throw new AppError('Your cart is empty', 400, errorCodes.BAD_REQUEST)
  }

  const inventoryIds = cart.items.map((i) => i.inventoryId)
  const rows = await Inventory.find({ _id: { $in: inventoryIds } }).lean()

  const byId = new Map(rows.map((r) => [String(r._id), r]))
  for (const item of cart.items) {
    const row = byId.get(String(item.inventoryId))
    if (!row || row.isSold || row.stock <= 0) {
      throw new AppError(`"${item.title}" is no longer available`, 409, errorCodes.CONFLICT)
    }
    if (!isReservedByUser(row, userId)) {
      throw new AppError(`Reservation expired for "${item.title}". Please add it again.`, 409, errorCodes.CONFLICT)
    }
  }

  return cart
}

export async function clearCartWithoutReleasing(userId) {
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } })
}
