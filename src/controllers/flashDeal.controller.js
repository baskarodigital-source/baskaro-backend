import { successResponse } from '../utils/helpers.js'
import * as flashDealService from '../services/flashDeal.service.js'
import * as flashDealSectionService from '../services/flashDealSection.service.js'

export async function listPublic(req, res) {
  const deals = await flashDealService.listActiveFlashDeals()
  return successResponse(res, deals, 'Flash deals retrieved successfully')
}

export async function getSection(req, res) {
  const section = await flashDealSectionService.getSection()
  return successResponse(res, section, 'Flash deal section retrieved successfully')
}

export async function upsertSection(req, res) {
  const section = await flashDealSectionService.upsertSection(req.body || {})
  return successResponse(res, section, 'Flash deal section updated successfully')
}

export async function listAll(req, res) {
  const { page = 1, limit = 50 } = req.query
  const data = await flashDealService.listAllFlashDeals({ page, limit })
  return successResponse(res, data, 'Flash deals retrieved successfully')
}

export async function getById(req, res) {
  const deal = await flashDealService.getFlashDealById(req.params.id)
  return successResponse(res, deal, 'Flash deal retrieved successfully')
}

export async function create(req, res) {
  const deal = await flashDealService.createFlashDeal(req.body)
  return successResponse(res, deal, 'Flash deal created successfully', 201)
}

export async function update(req, res) {
  const deal = await flashDealService.updateFlashDeal(req.params.id, req.body)
  return successResponse(res, deal, 'Flash deal updated successfully')
}

export async function remove(req, res) {
  const result = await flashDealService.deleteFlashDeal(req.params.id)
  return successResponse(res, result, 'Flash deal deleted successfully')
}
