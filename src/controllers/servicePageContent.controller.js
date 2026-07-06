import { successResponse } from '../utils/helpers.js'
import * as servicePageContentService from '../services/servicePageContent.service.js'

export async function getPublic(req, res) {
  const data = await servicePageContentService.getPublicByPageKey(req.params.pageKey)
  return successResponse(res, data, 'Service page content retrieved successfully')
}

export async function listAllAdmin(_req, res) {
  const items = await servicePageContentService.listAllPages()
  return successResponse(res, items, 'Service page content list retrieved successfully')
}

export async function getAdmin(req, res) {
  const data = await servicePageContentService.getAdminByPageKey(req.params.pageKey)
  return successResponse(res, data, 'Service page content retrieved successfully')
}

export async function upsertAdmin(req, res) {
  const data = await servicePageContentService.upsertPageContent(req.params.pageKey, req.body || {})
  return successResponse(res, data, 'Service page content saved successfully')
}

export async function removeAdmin(req, res) {
  const result = await servicePageContentService.deletePageContent(req.params.pageKey)
  return successResponse(res, result, 'Service page content deleted successfully')
}
