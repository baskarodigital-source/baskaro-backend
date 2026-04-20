import { successResponse } from '../utils/helpers.js'
import * as pickupManagementService from '../services/pickupManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Schedule pickup
export async function schedulePickup(req, res) {
  const pickupData = req.body
  const pickup = await pickupManagementService.schedulePickup(pickupData)
  return successResponse(res, pickup, 'Pickup scheduled successfully', 201)
}

// Get pickup by order ID
export async function getPickupByOrderId(req, res) {
  const { orderId } = req.params
  const pickup = await pickupManagementService.getPickupByOrderId(orderId)
  return successResponse(res, pickup, 'Pickup details retrieved successfully')
}

// Update pickup status
export async function updatePickupStatus(req, res) {
  const { pickupId } = req.params
  const { status, notes } = req.body
  
  if (!status) {
    throw new AppError('Status is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const pickup = await pickupManagementService.updatePickupStatus(pickupId, status, notes)
  return successResponse(res, pickup, 'Pickup status updated successfully')
}

// Assign agent to pickup
export async function assignAgent(req, res) {
  const { pickupId } = req.params
  const { agentName, agentPhone } = req.body
  
  if (!agentName || !agentPhone) {
    throw new AppError('Agent name and phone are required', 400, errorCodes.BAD_REQUEST)
  }
  
  const pickup = await pickupManagementService.assignAgent(pickupId, agentName, agentPhone)
  return successResponse(res, pickup, 'Agent assigned successfully')
}
