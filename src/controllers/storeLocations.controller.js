import { successResponse } from '../utils/helpers.js'
import * as storeLocationsService from '../services/storeLocations.service.js'

export async function listPublic(req, res) {
  const { city = '' } = req.query
  const data = await storeLocationsService.listPublicStores({ city })
  return successResponse(res, data, 'Store locations retrieved successfully')
}

export async function listAllAdmin(req, res) {
  const { page = 1, limit = 100 } = req.query
  const data = await storeLocationsService.listAllStoresAdmin({ page, limit })
  return successResponse(res, data, 'Store locations retrieved successfully')
}

export async function createAdmin(req, res) {
  const store = await storeLocationsService.createStoreAdmin(req.body || {})
  return successResponse(res, store, 'Store created successfully', 201)
}

export async function createBulkAdmin(req, res) {
  const stores = await storeLocationsService.createStoresBulkAdmin(req.body?.stores || [])
  return successResponse(res, stores, 'Stores created successfully', 201)
}

export async function updateAdmin(req, res) {
  const store = await storeLocationsService.updateStoreAdmin(req.params.id, req.body || {})
  return successResponse(res, store, 'Store updated successfully')
}

export async function deleteAdmin(req, res) {
  const result = await storeLocationsService.deleteStoreAdmin(req.params.id)
  return successResponse(res, result, 'Store deleted successfully')
}
