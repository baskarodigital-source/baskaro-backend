import { successResponse } from '../utils/helpers.js'
import * as productsService from '../services/products.service.js'

export async function list(req, res) {
  const {
    page = 1,
    limit = 20,
    categoryId,
    brandId,
    deviceId,
    q,
    includeInactive,
  } = req.query
  const data = await productsService.listProducts({
    page,
    limit,
    categoryId,
    brandId,
    deviceId,
    q,
    includeInactive: includeInactive === 'true',
  })
  return successResponse(res, data, 'Products retrieved successfully')
}

export async function getById(req, res) {
  const data = await productsService.getProductById(req.params.id)
  return successResponse(res, data, 'Product retrieved successfully')
}

export async function create(req, res) {
  const data = await productsService.createProduct(req.body || {})
  return successResponse(res, data, 'Product created successfully', 201)
}

export async function update(req, res) {
  const data = await productsService.updateProduct(req.params.id, req.body || {})
  return successResponse(res, data, 'Product updated successfully')
}

export async function remove(req, res) {
  const data = await productsService.deleteProduct(req.params.id)
  return successResponse(res, data, 'Product deleted successfully')
}
