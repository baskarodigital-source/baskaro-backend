import { uploadImageMulter, uploadVideoMulter, handleMulterError } from './uploadMulter.js'

/**
 * Compatibility layer for projects expecting `middleware/upload.js`.
 * Keeps current multer implementation in `uploadMulter.js` as the single source.
 */
export { uploadImageMulter, uploadVideoMulter, handleMulterError }

export const upload = {
  image: uploadImageMulter,
  video: uploadVideoMulter,
}

export default upload
