import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { getPagination, formatPaginationResponse } from '../utils/helpers.js'

// Get all users with pagination and search
export async function getAllUsers({ page = 1, limit = 10, search = '', status = '' }) {
  const { skip } = getPagination(page, limit)
  
  const query = {}
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }
  
  if (status && ['ACTIVE', 'BLOCKED'].includes(status)) {
    query.status = status
  }
  
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ])
  
  return formatPaginationResponse(users, total, page, limit)
}

// Get user by ID
export async function getUserById(userId) {
  const user = await User.findById(userId).select('-passwordHash')
  
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.NOT_FOUND)
  }
  
  // Get user's order count
  const orderCount = await mongoose.model('Order').countDocuments({ userId })
  
  return {
    ...user.toObject(),
    orderCount,
  }
}

// Block/Unblock user
export async function toggleUserBlockStatus(userId, status) {
  if (!['ACTIVE', 'BLOCKED'].includes(status)) {
    throw new AppError('Invalid status. Must be ACTIVE or BLOCKED', 400, errorCodes.BAD_REQUEST)
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  ).select('-passwordHash')
  
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.NOT_FOUND)
  }
  
  return user
}

// Delete user
export async function deleteUser(userId) {
  const user = await User.findByIdAndDelete(userId)
  
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.NOT_FOUND)
  }
  
  // Optionally delete user's orders or mark them as cancelled
  await mongoose.model('Order').updateMany(
    { userId },
    { status: 'CANCELLED' }
  )
  
  return { success: true, message: 'User deleted successfully' }
}

// Update user role (customers only — staff accounts use the Admin collection)
export async function updateUserRole(userId, role) {
  const validRoles = ['user']

  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400, errorCodes.BAD_REQUEST)
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select('-passwordHash')
  
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.NOT_FOUND)
  }
  
  return user
}
