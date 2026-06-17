import { successResponse } from '../utils/helpers.js'
import * as categoriesService from '../services/categories.service.js'

export async function list(req, res) {
  const includeInactive = req.query.includeInactive === 'true'
  const tree = req.query.tree !== 'false'
  const data = await categoriesService.listCategories({ includeInactive, tree })
  return successResponse(res, data, 'Categories retrieved successfully')
}

export async function create(req, res) {
  const data = await categoriesService.createCategory(req.body || {})
  return successResponse(res, data, 'Category created successfully', 201)
}

export async function update(req, res) {
  const data = await categoriesService.updateCategory(req.params.id, req.body || {})
  return successResponse(res, data, 'Category updated successfully')
}

export async function remove(req, res) {
  const data = await categoriesService.deleteCategory(req.params.id)
  return successResponse(res, data, 'Category deleted successfully')
}

export async function importFromRibbon(req, res) {
  const data = await categoriesService.importFromRibbonCategories()
  return successResponse(res, data, 'Ribbon categories imported into catalog builder')
}

export async function getByRibbon(req, res) {
  const data = await categoriesService.getCategoryByRibbonId(req.params.ribbonId)
  if (!data) {
    return res.status(404).json({ success: false, message: 'Linked catalog category not found', data: null })
  }
  return successResponse(res, data, 'Catalog category retrieved successfully')
}
