import { successResponse } from '../utils/helpers.js'
import * as deviceConditionService from '../services/deviceCondition.service.js'

// Get all device conditions
export async function getAllDeviceConditions(req, res) {
  const data = await deviceConditionService.getAllDeviceConditions()
  return successResponse(res, data, 'Device conditions retrieved successfully')
}

// Get device condition by type
export async function getDeviceCondition(req, res) {
  const { conditionType } = req.params
  const data = await deviceConditionService.getDeviceCondition(conditionType)
  return successResponse(res, data, 'Device condition retrieved successfully')
}

// Create device condition
export async function createDeviceCondition(req, res) {
  const conditionData = req.body
  const data = await deviceConditionService.createDeviceCondition(conditionData)
  return successResponse(res, data, 'Device condition created successfully', 201)
}

// Update device condition
export async function updateDeviceCondition(req, res) {
  const { conditionId } = req.params
  const updateData = req.body
  const data = await deviceConditionService.updateDeviceCondition(conditionId, updateData)
  return successResponse(res, data, 'Device condition updated successfully')
}

// Delete device condition
export async function deleteDeviceCondition(req, res) {
  const { conditionId } = req.params
  const result = await deviceConditionService.deleteDeviceCondition(conditionId)
  return successResponse(res, result, 'Device condition deleted successfully')
}

// Calculate final price
export async function calculateFinalPrice(req, res) {
  const { basePrice, conditionType, deductions } = req.body
  
  if (!basePrice || !conditionType) {
    return res.status(400).json({
      success: false,
      message: 'basePrice and conditionType are required',
    })
  }
  
  const data = await deviceConditionService.calculateFinalPrice(basePrice, conditionType, deductions)
  return successResponse(res, data, 'Price calculated successfully')
}
