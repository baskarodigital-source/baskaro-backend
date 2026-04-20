import { RibbonCategory } from '../models/RibbonCategory.js'
import { successResponse } from '../utils/helpers.js'
import { SPEC_TEMPLATES_BY_CATEGORY, normalizeCategoryLabel } from '../config/specificationTemplates.js'

export async function getSpecificationsByCategory(req, res) {
  const { categoryId } = req.params
  const cat = await RibbonCategory.findById(categoryId).lean()
  if (!cat) {
    return res.status(404).json({ success: false, message: 'Category not found', data: [] })
  }

  const key = normalizeCategoryLabel(cat.label)
  const specs = SPEC_TEMPLATES_BY_CATEGORY[key] || []
  return successResponse(res, specs, 'Specifications retrieved successfully')
}

