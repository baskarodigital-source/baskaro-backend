import { successResponse } from '../utils/helpers.js'
import * as preOwnedFeaturedService from '../services/preOwnedFeatured.service.js'

export async function listFeatured(req, res) {
  const limit = req.query?.limit
  const items = await preOwnedFeaturedService.listFeaturedPreOwned({ limit })
  return successResponse(res, items, 'Featured pre-owned devices retrieved successfully')
}
