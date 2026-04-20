import { successResponse } from '../utils/helpers.js'
import * as userManagementService from '../services/userManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Get all users with pagination and search
export async function getAllUsers(req, res) {
  const { page = 1, limit = 10, search = '', status = '' } = req.query
  const data = await userManagementService.getAllUsers({ 
    page, 
    limit, 
    search, 
    status 
  })
  return successResponse(res, data, 'Users retrieved successfully')
}

// Get user by ID
export async function getUserById(req, res) {
  const { userId } = req.params
  const user = await userManagementService.getUserById(userId)
  return successResponse(res, user, 'User retrieved successfully')
}

// Block user
export async function blockUser(req, res) {
  const { userId } = req.params
  const user = await userManagementService.toggleUserBlockStatus(userId, 'BLOCKED')
  return successResponse(res, user, 'User blocked successfully')
}

// Unblock user
export async function unblockUser(req, res) {
  const { userId } = req.params
  const user = await userManagementService.toggleUserBlockStatus(userId, 'ACTIVE')
  return successResponse(res, user, 'User unblocked successfully')
}

// Delete user
export async function deleteUser(req, res) {
  const { userId } = req.params
  const result = await userManagementService.deleteUser(userId)
  return successResponse(res, result, 'User deleted successfully', 200)
}

// Update user role
export async function updateUserRole(req, res) {
  const { userId } = req.params
  const { role } = req.body
  
  if (!role) {
    throw new AppError('Role is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const user = await userManagementService.updateUserRole(userId, role)
  return successResponse(res, user, 'User role updated successfully')
}
