import { DeviceCondition } from '../models/DeviceCondition.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Get all device conditions
export async function getAllDeviceConditions() {
  const conditions = await DeviceCondition.find({ isActive: true })
    .sort({ condition: 1 })
  return conditions
}

// Get device condition by type
export async function getDeviceCondition(conditionType) {
  const condition = await DeviceCondition.findOne({ 
    condition: conditionType,
    isActive: true 
  })
  
  if (!condition) {
    throw new AppError('Device condition not found', 404, errorCodes.NOT_FOUND)
  }
  
  return condition
}

// Create device condition
export async function createDeviceCondition(conditionData) {
  // Check if condition already exists
  const existing = await DeviceCondition.findOne({ condition: conditionData.condition })
  if (existing) {
    throw new AppError('Device condition already exists', 409, errorCodes.CONFLICT)
  }
  
  const condition = await DeviceCondition.create(conditionData)
  return condition
}

// Update device condition
export async function updateDeviceCondition(conditionId, updateData) {
  const condition = await DeviceCondition.findByIdAndUpdate(
    conditionId,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!condition) {
    throw new AppError('Device condition not found', 404, errorCodes.NOT_FOUND)
  }
  
  return condition
}

// Delete device condition
export async function deleteDeviceCondition(conditionId) {
  const condition = await DeviceCondition.findByIdAndDelete(conditionId)
  
  if (!condition) {
    throw new AppError('Device condition not found', 404, errorCodes.NOT_FOUND)
  }
  
  return { success: true, message: 'Device condition deleted successfully' }
}

// Calculate final price based on base price and deductions
export async function calculateFinalPrice(basePrice, conditionType, customDeductions = {}) {
  const condition = await DeviceCondition.findOne({ 
    condition: conditionType,
    isActive: true 
  })
  
  if (!condition) {
    throw new AppError('Invalid device condition', 400, errorCodes.BAD_REQUEST)
  }
  
  const deductions = {
    screen: customDeductions.screen || condition.deductions.screen,
    battery: customDeductions.battery || condition.deductions.battery,
    camera: customDeductions.camera || condition.deductions.camera,
    faceId: customDeductions.faceId || condition.deductions.faceId,
  }
  
  const totalDeduction = Object.values(deductions).reduce((sum, val) => sum + val, 0)
  const finalPrice = Math.max(0, basePrice - totalDeduction)
  
  return {
    basePrice,
    deductions,
    totalDeduction,
    finalPrice,
    condition: condition.condition,
  }
}
