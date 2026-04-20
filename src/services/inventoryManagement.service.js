import { Inventory } from '../models/Inventory.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Add to inventory
export async function addToInventory(inventoryData) {
  // Validate phone model exists
  const phoneModel = await PhoneModel.findById(inventoryData.modelId)
  if (!phoneModel) {
    throw new AppError('Phone model not found', 404, errorCodes.NOT_FOUND)
  }
  
  const inventory = await Inventory.create({
    ...inventoryData,
    brandId: phoneModel.brandId,
  })
  
  return inventory.populate('modelId brandId', 'modelName name slug')
}

// Get all inventory items
export async function getAllInventory({ 
  page = 1, 
  limit = 10, 
  brandId = '', 
  modelId = '', 
  conditionGrade = '',
  isSold = null 
}) {
  const query = {}
  
  if (brandId) query.brandId = brandId
  if (modelId) query.modelId = modelId
  if (conditionGrade) query.conditionGrade = conditionGrade
  if (isSold !== null) query.isSold = isSold
  
  const skip = (parseInt(page) - 1) * parseInt(limit)
  
  const [items, total] = await Promise.all([
    Inventory.find(query)
      .populate('modelId', 'modelName slug')
      .populate('brandId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(query),
  ])
  
  return {
    items,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: page * limit < total,
    },
  }
}

// Get inventory by ID
export async function getInventoryById(inventoryId) {
  const item = await Inventory.findById(inventoryId)
    .populate('modelId', 'modelName slug specifications')
    .populate('brandId', 'name slug')
  
  if (!item) {
    throw new AppError('Inventory item not found', 404, errorCodes.NOT_FOUND)
  }
  
  return item
}

// Update inventory stock
export async function updateInventoryStock(inventoryId, stock) {
  const item = await Inventory.findByIdAndUpdate(
    inventoryId,
    { stock },
    { new: true, runValidators: true }
  ).populate('modelId brandId', 'modelName name slug')
  
  if (!item) {
    throw new AppError('Inventory item not found', 404, errorCodes.NOT_FOUND)
  }
  
  return item
}

// Mark as sold
export async function markAsSold(inventoryId) {
  const item = await Inventory.findByIdAndUpdate(
    inventoryId,
    { 
      isSold: true,
      soldAt: new Date(),
      stock: 0
    },
    { new: true, runValidators: true }
  )
  
  if (!item) {
    throw new AppError('Inventory item not found', 404, errorCodes.NOT_FOUND)
  }
  
  return item
}

// Update inventory price
export async function updateInventoryPrice(inventoryId, price) {
  const item = await Inventory.findByIdAndUpdate(
    inventoryId,
    { price },
    { new: true, runValidators: true }
  )
  
  if (!item) {
    throw new AppError('Inventory item not found', 404, errorCodes.NOT_FOUND)
  }
  
  return item
}
