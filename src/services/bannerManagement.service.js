import { Banner } from '../models/Banner.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'

// Create banner
export async function createBanner(bannerData) {
  const banner = await Banner.create(bannerData)
  return banner
}

// Get all banners
export async function getAllBanners({ position = '', active = true }) {
  const query = {}
  
  if (position) {
    query.position = position
  }
  
  if (active !== null) {
    query.isActive = active
  }
  
  // Filter by date range
  const now = new Date()
  query.$or = [
    { startDate: { $lte: now }, endDate: { $gte: now } },
    { startDate: null, endDate: null },
    { startDate: { $lte: now }, endDate: null },
  ]
  
  const banners = await Banner.find(query)
    .sort({ displayOrder: 1, createdAt: -1 })
  
  return banners
}

// Get banner by ID
export async function getBannerById(bannerId) {
  const banner = await Banner.findById(bannerId)
  
  if (!banner) {
    throw new AppError('Banner not found', 404, errorCodes.NOT_FOUND)
  }
  
  return banner
}

// Update banner
export async function updateBanner(bannerId, updateData) {
  const banner = await Banner.findByIdAndUpdate(
    bannerId,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!banner) {
    throw new AppError('Banner not found', 404, errorCodes.NOT_FOUND)
  }
  
  return banner
}

// Delete banner
export async function deleteBanner(bannerId) {
  const banner = await Banner.findByIdAndDelete(bannerId)
  
  if (!banner) {
    throw new AppError('Banner not found', 404, errorCodes.NOT_FOUND)
  }
  
  return { success: true, message: 'Banner deleted successfully' }
}

// Activate/Deactivate banner
export async function toggleBannerStatus(bannerId, isActive) {
  const banner = await Banner.findByIdAndUpdate(
    bannerId,
    { isActive },
    { new: true, runValidators: true }
  )
  
  if (!banner) {
    throw new AppError('Banner not found', 404, errorCodes.NOT_FOUND)
  }
  
  return banner
}
