import { successResponse } from '../utils/helpers.js'
import * as bannerManagementService from '../services/bannerManagement.service.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Create banner
export async function createBanner(req, res) {
  const bannerData = req.body
  const banner = await bannerManagementService.createBanner(bannerData)
  return successResponse(res, banner, 'Banner created successfully', 201)
}

// Get all banners
export async function getAllBanners(req, res) {
  const { position = '' } = req.query
  let active = true
  if (req.query.active === 'false' || req.query.active === '0') active = false
  else if (req.query.active === 'all') active = null
  const banners = await bannerManagementService.getAllBanners({ position, active })
  return successResponse(res, banners, 'Banners retrieved successfully')
}

// Get banner by ID
export async function getBannerById(req, res) {
  const { bannerId } = req.params
  const banner = await bannerManagementService.getBannerById(bannerId)
  return successResponse(res, banner, 'Banner retrieved successfully')
}

// Update banner
export async function updateBanner(req, res) {
  const { bannerId } = req.params
  const updateData = req.body
  const banner = await bannerManagementService.updateBanner(bannerId, updateData)
  return successResponse(res, banner, 'Banner updated successfully')
}

// Delete banner
export async function deleteBanner(req, res) {
  const { bannerId } = req.params
  const result = await bannerManagementService.deleteBanner(bannerId)
  return successResponse(res, result, 'Banner deleted successfully')
}

// Toggle banner status
export async function toggleBannerStatus(req, res) {
  const { bannerId } = req.params
  const { isActive } = req.body
  
  if (isActive === undefined) {
    throw new AppError('isActive is required', 400, errorCodes.BAD_REQUEST)
  }
  
  const banner = await bannerManagementService.toggleBannerStatus(bannerId, isActive)
  return successResponse(res, banner, 'Banner status updated successfully')
}
