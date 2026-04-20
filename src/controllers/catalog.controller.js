import {
  getActiveBrands,
  getActiveBrandsWithActiveModels,
  getActiveModelsByBrandId,
  getActiveVariantsByPhoneModelId,
  getCatalogStructure,
} from '../services/catalog.service.js'
import mongoose from 'mongoose'

export async function listBrands(_req, res) {
  const brands = await getActiveBrands()
  return res.json(brands)
}

export async function listPhoneBrands(_req, res) {
  const brands = await getActiveBrandsWithActiveModels()
  return res.json(brands)
}

export async function listModels(req, res) {
  const { brandId } = req.query
  if (!brandId) return res.status(400).json({ error: 'brandId is required' })
  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    return res.status(400).json({ error: 'brandId must be a valid ObjectId' })
  }
  const models = await getActiveModelsByBrandId(brandId)
  return res.json(models)
}

export async function listVariants(req, res) {
  const { modelId } = req.query
  if (!modelId) return res.status(400).json({ error: 'modelId is required' })
  if (!mongoose.Types.ObjectId.isValid(modelId)) {
    return res.status(400).json({ error: 'modelId must be a valid ObjectId' })
  }
  const variants = await getActiveVariantsByPhoneModelId(modelId)
  return res.json(variants)
}

export async function getStructure(_req, res) {
  const structure = await getCatalogStructure()
  return res.json(structure)
}

