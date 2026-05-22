/** Allowed Cloudinary folder prefixes for admin uploads */
export const CLOUDINARY_FOLDERS = {
  general: 'baskaro/general',
  homeServices: 'baskaro/home-services',
  offers: 'baskaro/offers',
  flashDeals: 'baskaro/flash-deals',
  banners: 'baskaro/banners',
  ribbon: 'baskaro/ribbon-categories',
  brands: 'baskaro/brands',
  devices: 'baskaro/devices',
  models: 'baskaro/models',
  inventory: 'baskaro/inventory',
  cms: 'baskaro/cms',
}

const ALLOWED = new Set(Object.values(CLOUDINARY_FOLDERS))

export function normalizeUploadFolder(folder) {
  const f = String(folder || CLOUDINARY_FOLDERS.general).trim()
  return ALLOWED.has(f) ? f : null
}
