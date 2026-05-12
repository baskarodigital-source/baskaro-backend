import { successResponse } from '../utils/helpers.js'
import * as servicePageContentService from '../services/servicePageContent.service.js'

export async function getPublic(req, res) {
  const data = await servicePageContentService.getPublicByPageKey(req.params.pageKey)
  return successResponse(res, data, 'Service page content retrieved successfully')
}
