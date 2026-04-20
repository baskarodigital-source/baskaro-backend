import { successResponse } from '../utils/helpers.js'
import * as inventoryManagementService from '../services/inventoryManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Add to inventory
export async function addToInventory(req, res) {
  const inventoryData = req.body
  const item = await inventoryManagementService.addToInventory(inventoryData)
  return successResponse(res, item, 'Item added to inventory successfully', 201)
}

// Get all inventory items
export async function getAllInventory(req, res) {
  const filters = req.query
  const data = await inventoryManagementService.getAllInventory(filters)
  return successResponse(res, data, 'Inventory items retrieved successfully')
}

// Get inventory by ID
export async function getInventoryById(req, res) {
  const { inventoryId } = req.params
  const item = await inventoryManagementService.getInventoryById(inventoryId)
  return successResponse(res, item, 'Inventory item retrieved successfully')
}

// Update inventory stock
export async function updateInventoryStock(req, res) {
  const { inventoryId } = req.params
  const { stock } = req.body
  
  if (stock === undefined) {
    throw new AppError('Stock is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const item = await inventoryManagementService.updateInventoryStock(inventoryId, stock)
  return successResponse(res, item, 'Inventory stock updated successfully')
}

// Mark as sold
export async function markAsSold(req, res) {
  const { inventoryId } = req.params
  const item = await inventoryManagementService.markAsSold(inventoryId)
  return successResponse(res, item, 'Inventory item marked as sold')
}

// Update inventory price
export async function updateInventoryPrice(req, res) {
  const { inventoryId } = req.params
  const { price } = req.body
  
  if (price === undefined) {
    throw new AppError('Price is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const item = await inventoryManagementService.updateInventoryPrice(inventoryId, price)
  return successResponse(res, item, 'Inventory price updated successfully')
}
