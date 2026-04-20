import { successResponse } from '../utils/helpers.js'
import * as offerService from '../services/offer.service.js'

export async function listPublic(req, res) {
  const { modelId = '' } = req.query
  const offers = await offerService.listActiveOffers({ modelId })
  return successResponse(res, offers, 'Offers retrieved successfully')
}

export async function listAll(req, res) {
  const { page = 1, limit = 100, modelId = '' } = req.query
  const data = await offerService.listAllOffers({ page, limit, modelId })
  return successResponse(res, data, 'Offers retrieved successfully')
}

export async function getById(req, res) {
  const offer = await offerService.getOfferById(req.params.id)
  return successResponse(res, offer, 'Offer retrieved successfully')
}

export async function create(req, res) {
  const offer = await offerService.createOffer(req.body || {})
  return successResponse(res, offer, 'Offer created successfully', 201)
}

export async function update(req, res) {
  const offer = await offerService.updateOffer(req.params.id, req.body || {})
  return successResponse(res, offer, 'Offer updated successfully')
}

export async function remove(req, res) {
  const result = await offerService.deleteOffer(req.params.id)
  return successResponse(res, result, 'Offer deleted successfully')
}

