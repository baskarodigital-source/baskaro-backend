import { RibbonCategory } from '../models/RibbonCategory.js'
import { Brand } from '../models/Brand.js'
import { PhoneModel } from '../models/PhoneModel.js'
import * as CategoryModelModule from '../models/Category.js'

const Category =
  CategoryModelModule.Category || CategoryModelModule.default || CategoryModelModule

function slugifyLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function resolveCategorySlug(ribbon) {
  if (ribbon.catalogCategoryId) {
    const cat = await Category.findById(ribbon.catalogCategoryId).select('slug').lean()
    if (cat?.slug) return String(cat.slug).trim()
  }
  const linked = await Category.findOne({ ribbonCategoryId: ribbon._id }).select('slug').lean()
  if (linked?.slug) return String(linked.slug).trim()
  return slugifyLabel(ribbon.label)
}

export async function getSellNavMegaMenu() {
  const ribbons = await RibbonCategory.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()

  const groups = []
  for (const ribbon of ribbons) {
    const slug = await resolveCategorySlug(ribbon)
    const brands = await Brand.find({ ribbonCategoryId: ribbon._id, active: true })
      .sort({ sortOrder: 1, name: 1 })
      .limit(12)
      .lean()

    const brandIds = brands.map((b) => b._id)
    let selling = []
    if (brandIds.length) {
      selling = await PhoneModel.find({ brandId: { $in: brandIds }, active: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(4)
        .populate('brandId', 'name slug')
        .lean()
    }

    if (!brands.length && !selling.length) continue

    groups.push({
      title: ribbon.label,
      slug,
      brands: brands.map((b) => ({ name: b.name, slug: b.slug })),
      selling: selling.map((m) => ({
        name: m.modelName,
        slug: m.slug,
        brandSlug: m.brandId?.slug || '',
        brandName: m.brandId?.name || '',
      })),
    })
  }

  return groups
}
