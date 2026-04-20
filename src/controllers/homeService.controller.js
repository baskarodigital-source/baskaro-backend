import { successResponse } from '../utils/helpers.js'
import * as homeServiceService from '../services/homeService.service.js'

export async function listPublic(_req, res) {
  const items = await homeServiceService.listActiveServices()
  return successResponse(res, items, 'Services retrieved successfully')
}

export async function listAll(req, res) {
  const { page = 1, limit = 100 } = req.query
  const data = await homeServiceService.listAllServices({ page, limit })
  return successResponse(res, data, 'Services retrieved successfully')
}

export async function create(req, res) {
  const created = await homeServiceService.createService(req.body || {})
  return successResponse(res, created, 'Service created successfully', 201)
}

export async function update(req, res) {
  const updated = await homeServiceService.updateService(req.params.id, req.body || {})
  return successResponse(res, updated, 'Service updated successfully')
}

export async function remove(req, res) {
  const result = await homeServiceService.deleteService(req.params.id)
  return successResponse(res, result, 'Service deleted successfully')
}

