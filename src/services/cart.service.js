import mongoose from 'mongoose'
import { Cart } from '../models/Cart.js'
import { Inventory } from '../models/Inventory.js'
import {
  isReservedByUser,
  releaseReservation,
  reserveInventory,
} from './inventoryReservation.service.js'
import { Product } from '../models/Product.js'
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

function pickCatalogVariant(product, variantId = '') {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const active = variants.filter((v) => v?.isActive !== false)
  if (variantId) {
    const match =
      active.find((v) => String(v._id) === String(variantId)) ||
      variants.find((v) => String(v._id) === String(variantId))
    if (match) return match
  }
  return active.find((v) => v?.isDefault) || active[0] || variants[0] || null
}

function pickCatalogImage(product, variant) {
  const variantImg = Array.isArray(variant?.images) ? variant.images.find((i) => i?.url)?.url : ''
  if (variantImg) return String(variantImg).trim()
  const productImg = Array.isArray(product?.images) ? product.images.find((i) => i?.url)?.url : ''
  if (productImg) return String(productImg).trim()
  return ''
}

function mapCartItem(item, viewerUserId) {
  if (item.productId) {
    const lineId = item.variantId ? String(item.variantId) : String(item.productId)
    return {
      productId: String(item.productId),
      variantId: item.variantId ? String(item.variantId) : '',
      inventoryId: null,
      itemType: 'catalog',
      quantity: item.quantity,
      unitPriceInr: item.unitPriceInr,
      title: item.title,
      imageUrl: item.imageUrl,
      conditionGrade: item.conditionGrade,
      id: lineId,
      name: item.title,
      price: String(item.unitPriceInr),
      img: item.imageUrl,
      reservedByYou: false,
      viewerUserId,
    }
  }

  return {
    inventoryId: String(item.inventoryId),
    itemType: 'inventory',
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

export async function addCatalogProductToCart(userId, productId, variantId = '') {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid productId', 400, errorCodes.BAD_REQUEST)
  }

  const product = await Product.findById(productId).lean()
  if (!product || product.isActive === false) {
    throw new AppError('Product not found', 404, errorCodes.NOT_FOUND)
  }

  const variant = pickCatalogVariant(product, variantId)
  if (!variant) {
    throw new AppError('No purchasable variant for this product', 400, errorCodes.BAD_REQUEST)
  }
  if (!(Number(variant.stock) > 0)) {
    throw new AppError('This product is out of stock', 409, errorCodes.CONFLICT)
  }

  const cart = await getOrCreateCart(userId)
  const vid = variant._id ? String(variant._id) : ''
  const existing = cart.items.find(
    (i) => String(i.productId) === String(productId) && String(i.variantId || '') === vid,
  )
  if (existing) {
    return getCartForUser(userId)
  }

  const title = [product.name, variant.title].filter(Boolean).join(' — ') || product.name
  const line = {
    productId: product._id,
    variantId: variant._id || null,
    quantity: 1,
    unitPriceInr: Math.round(Number(variant.price) || 0),
    title,
    imageUrl: pickCatalogImage(product, variant),
    conditionGrade: String(variant.condition || '').trim(),
  }

  cart.items.push(line)
  await cart.save()
  return getCartForUser(userId)
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
    if (item.inventoryId) {
      await releaseReservation(item.inventoryId, userId)
    }
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

  const inventoryItems = cart.items.filter((i) => i.inventoryId)
  const inventoryIds = inventoryItems.map((i) => i.inventoryId)
  const rows = inventoryIds.length
    ? await Inventory.find({ _id: { $in: inventoryIds } }).lean()
    : []

  const byId = new Map(rows.map((r) => [String(r._id), r]))
  for (const item of inventoryItems) {
    const row = byId.get(String(item.inventoryId))
    if (!row || row.isSold || row.stock <= 0) {
      throw new AppError(`"${item.title}" is no longer available`, 409, errorCodes.CONFLICT)
    }
    if (!isReservedByUser(row, userId)) {
      throw new AppError(`Reservation expired for "${item.title}". Please add it again.`, 409, errorCodes.CONFLICT)
    }
  }

  const catalogItems = cart.items.filter((i) => i.productId)
  if (catalogItems.length) {
    const productIds = [...new Set(catalogItems.map((i) => String(i.productId)))]
    const products = await Product.find({ _id: { $in: productIds } }).lean()
    const productsById = new Map(products.map((p) => [String(p._id), p]))

    for (const item of catalogItems) {
      const product = productsById.get(String(item.productId))
      if (!product || product.isActive === false) {
        throw new AppError(`"${item.title}" is no longer available`, 409, errorCodes.CONFLICT)
      }
      const variant = pickCatalogVariant(product, item.variantId)
      if (!variant || !(Number(variant.stock) > 0)) {
        throw new AppError(`"${item.title}" is out of stock`, 409, errorCodes.CONFLICT)
      }
    }
  }

  return cart
}

export async function clearCartWithoutReleasing(userId) {
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } })
}
