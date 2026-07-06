import { successResponse } from '../utils/helpers.js'
import * as cmsService from '../services/cms.service.js'

export async function listPublic(_req, res) {
  const pages = await cmsService.listPublicPages()
  return successResponse(res, pages, 'Pages retrieved successfully')
}

export async function getPublicBySlug(req, res) {
  const page = await cmsService.getPublicPageBySlug(req.params.slug)
  return successResponse(res, page, 'Page retrieved successfully')
}

export async function listAllAdmin(req, res) {
  const { page = 1, limit = 100 } = req.query
  const data = await cmsService.listAllPagesAdmin({ page, limit })
  return successResponse(res, data, 'Pages retrieved successfully')
}

export async function getAdminBySlug(req, res) {
  const page = await cmsService.getAdminPageBySlug(req.params.slug)
  return successResponse(res, page, 'Page retrieved successfully')
}

export async function createAdmin(req, res) {
  const page = await cmsService.createPageAdmin(req.body || {})
  return successResponse(res, page, 'Page created successfully', 201)
}

export async function updateAdmin(req, res) {
  const page = await cmsService.updatePageAdmin(req.params.id, req.body || {})
  return successResponse(res, page, 'Page updated successfully')
}

export async function deleteAdmin(req, res) {
  const result = await cmsService.deletePageAdmin(req.params.id)
  return successResponse(res, result, 'Page deleted successfully')
}
