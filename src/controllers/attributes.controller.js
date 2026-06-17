import { successResponse } from '../utils/helpers.js'
import * as attributesService from '../services/attributes.service.js'

export async function list(req, res) {
  const includeInactive = req.query.includeInactive === 'true'
  const categoryId = req.query.categoryId
  const data = await attributesService.listAttributes({ includeInactive, categoryId })
  return successResponse(res, data, 'Attributes retrieved successfully')
}

export async function create(req, res) {
  const data = await attributesService.createAttribute(req.body || {})
  return successResponse(res, data, 'Attribute created successfully', 201)
}

export async function update(req, res) {
  const data = await attributesService.updateAttribute(req.params.id, req.body || {})
  return successResponse(res, data, 'Attribute updated successfully')
}

export async function remove(req, res) {
  const data = await attributesService.deleteAttribute(req.params.id)
  return successResponse(res, data, 'Attribute deleted successfully')
}
