import { Banner } from '../models/Banner.js'
import { CLOUDINARY_FOLDERS } from '../constants/cloudinaryFolders.js'
import { AppError, errorCodes } from '../utils/errorHandler.js'
import { persistImageToCloudinary } from '../utils/persistImageToCloudinary.js'

// Create banner
export async function createBanner(bannerData) {
  const data = { ...bannerData }
  const raw =
    data.imageUrl != null
      ? String(data.imageUrl).trim()
      : data.imgUrl != null
        ? String(data.imgUrl).trim()
        : ''
  if (raw) {
    const url = await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.banners)
    data.imageUrl = url
    if ('imgUrl' in data) data.imgUrl = url
  }
  const banner = await Banner.create(data)
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
  const data = { ...updateData }
  const rawField =
    data.imageUrl !== undefined ? 'imageUrl' : data.imgUrl !== undefined ? 'imgUrl' : null
  if (rawField) {
    const raw = data[rawField] != null ? String(data[rawField]).trim() : ''
    if (raw) {
      const url = await persistImageToCloudinary(raw, CLOUDINARY_FOLDERS.banners)
      data.imageUrl = url
      if ('imgUrl' in data) data.imgUrl = url
    } else {
      data.imageUrl = ''
    }
  }
  const banner = await Banner.findByIdAndUpdate(
    bannerId,
    data,
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
