import { successResponse } from '../utils/helpers.js'
import * as ribbonCategoryService from '../services/ribbonCategory.service.js'

export async function listPublic(req, res) {
  const data = await ribbonCategoryService.listActiveRibbonCategories()
  return successResponse(res, data, 'Ribbon categories retrieved successfully')
}

export async function listAll(req, res) {
  const data = await ribbonCategoryService.listAllRibbonCategories()
  return successResponse(res, data, 'Ribbon categories retrieved successfully')
}

export async function create(req, res) {
  const data = await ribbonCategoryService.createRibbonCategory(req.body)
  return successResponse(res, data, 'Ribbon category created', 201)
}

export async function update(req, res) {
  const data = await ribbonCategoryService.updateRibbonCategory(req.params.id, req.body)
  return successResponse(res, data, 'Ribbon category updated')
}

export async function remove(req, res) {
  const data = await ribbonCategoryService.deleteRibbonCategory(req.params.id)
  return successResponse(res, data, 'Ribbon category deleted')
}
