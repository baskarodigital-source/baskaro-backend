import { Router } from 'express'
import {
  getStructure,
  listBrands,
  listPhoneBrands,
  listModels,
  listVariants,
} from '../controllers/catalog.controller.js'

const router = Router()

router.get('/brands', listBrands)
router.get('/phone-brands', listPhoneBrands)
router.get('/models', listModels)
router.get('/variants', listVariants)
router.get('/structure', getStructure)

export default router
