import mongoose from 'mongoose'
import { Pickup } from '../models/Pickup.js'
import { Order } from '../models/Order.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Schedule pickup
export async function schedulePickup(pickupData) {
  if (!mongoose.Types.ObjectId.isValid(pickupData?.orderId)) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  // Check if order exists and is in valid status
  const order = await Order.findById(pickupData.orderId)
  if (!order) {
    throw new AppError('Order not found', 404, errorCodes.NOT_FOUND)
  }
  
  if (!['PLACED', 'PICKUP_SCHEDULED'].includes(order.status)) {
    throw new AppError('Cannot schedule pickup for order in current status', 400, errorCodes.BAD_REQUEST)
  }
  
  // Check if pickup already exists for this order
  const existingPickup = await Pickup.findOne({ orderId: pickupData.orderId })
  if (existingPickup) {
    throw new AppError('Pickup already scheduled for this order', 409, errorCodes.CONFLICT)
  }
  
  const pickup = await Pickup.create(pickupData)
  
  // Update order status
  await Order.findByIdAndUpdate(pickupData.orderId, {
    status: 'PICKUP_SCHEDULED',
    statusHistory: [{
      status: 'PICKUP_SCHEDULED',
      at: new Date(),
      notes: 'Pickup scheduled'
    }]
  })
  
  return pickup
}

// Get pickup by order ID
export async function getPickupByOrderId(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Pickup not found', 404, errorCodes.NOT_FOUND)
  }
  const pickup = await Pickup.findOne({ orderId }).populate('orderId', 'status brand modelName')
  
  if (!pickup) {
    throw new AppError('Pickup not found', 404, errorCodes.NOT_FOUND)
  }
  
  return pickup
}

// Update pickup status
export async function updatePickupStatus(pickupId, status, notes = '') {
  const validStatuses = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid pickup status', 400, errorCodes.BAD_REQUEST)
  }
  
  const pickup = await Pickup.findByIdAndUpdate(
    pickupId,
    { status, notes },
    { new: true, runValidators: true }
  )
  
  if (!pickup) {
    throw new AppError('Pickup not found', 404, errorCodes.NOT_FOUND)
  }
  
  // Update order status if pickup is completed or cancelled
  if (status === 'COMPLETED') {
    await Order.findByIdAndUpdate(pickup.orderId, {
      status: 'VERIFIED',
      statusHistory: [{
        status: 'VERIFIED',
        at: new Date(),
        notes: 'Device verified after pickup'
      }]
    })
  } else if (status === 'CANCELLED') {
    await Order.findByIdAndUpdate(pickup.orderId, {
      status: 'CANCELLED',
      statusHistory: [{
        status: 'CANCELLED',
        at: new Date(),
        notes: notes || 'Pickup cancelled'
      }]
    })
  }
  
  return pickup
}

// Assign agent to pickup
export async function assignAgent(pickupId, agentName, agentPhone) {
  const pickup = await Pickup.findByIdAndUpdate(
    pickupId,
    { agentName, agentPhone, status: 'SCHEDULED' },
    { new: true, runValidators: true }
  )
  
  if (!pickup) {
    throw new AppError('Pickup not found', 404, errorCodes.NOT_FOUND)
  }
  
  return pickup
}
