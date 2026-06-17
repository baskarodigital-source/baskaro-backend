import Joi from 'joi'
import mongoose from 'mongoose'
import { AppError, errorCodes } from '../utils/errorHandler.js'

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid')
  }
  return value
}, 'ObjectId validation')

const seoSchema = Joi.object({
  title: Joi.string().trim().max(120).allow(''),
  description: Joi.string().trim().max(320).allow(''),
  keywords: Joi.array().items(Joi.string().trim().max(80)).default([]),
})

const imageSchema = Joi.object({
  url: Joi.string().trim().max(2048).required(),
  publicId: Joi.string().trim().max(255).allow(''),
  alt: Joi.string().trim().max(180).allow(''),
  isPrimary: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
})

const productAttributeSchema = Joi.object({
  attributeId: objectId.required(),
  code: Joi.string().trim().max(120).allow(''),
  name: Joi.string().trim().max(120).allow(''),
  value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array(), Joi.valid(null)),
})

const variantSchema = Joi.object({
  sku: Joi.string().trim().max(80).allow(''),
  title: Joi.string().trim().max(180).allow(''),
  condition: Joi.string().trim().max(80).allow(''),
  attributes: Joi.array().items(productAttributeSchema).default([]),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  images: Joi.array().items(imageSchema).default([]),
  isDefault: Joi.boolean(),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
})

const attributeValueSchema = Joi.object({
  label: Joi.string().trim().max(80).required(),
  value: Joi.string().trim().max(120).required(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
})

export const idParamSchema = Joi.object({
  id: objectId.required(),
})

export const listCategoriesQuerySchema = Joi.object({
  includeInactive: Joi.string().valid('true', 'false'),
  tree: Joi.string().valid('true', 'false'),
})

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  slug: Joi.string().trim().max(150),
  parent: Joi.alternatives().try(objectId, Joi.valid(null, '')).empty('').default(null),
  icon: Joi.string().trim().max(2048).allow(null, ''),
  image: Joi.string().trim().max(2048).allow(null, ''),
  seo: seoSchema.default({}),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
})

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  slug: Joi.string().trim().max(150),
  parent: Joi.alternatives().try(objectId, Joi.valid(null, '')).empty('').default(null),
  icon: Joi.string().trim().max(2048).allow(null, ''),
  image: Joi.string().trim().max(2048).allow(null, ''),
  seo: seoSchema,
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
}).min(1)

export const listAttributesQuerySchema = Joi.object({
  includeInactive: Joi.string().valid('true', 'false'),
  categoryId: objectId,
})

export const createAttributeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  code: Joi.string().trim().max(120),
  type: Joi.string().valid('select', 'multiselect', 'text', 'number', 'boolean', 'media').default('select'),
  categories: Joi.array().items(objectId).min(1).required(),
  values: Joi.array().items(attributeValueSchema).default([]),
  isRequired: Joi.boolean(),
  isVariantAxis: Joi.boolean(),
  useInFilter: Joi.boolean(),
  showOnProduct: Joi.boolean(),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
})

export const updateAttributeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  code: Joi.string().trim().max(120),
  type: Joi.string().valid('select', 'multiselect', 'text', 'number', 'boolean', 'media'),
  categories: Joi.array().items(objectId).min(1),
  values: Joi.array().items(attributeValueSchema),
  isRequired: Joi.boolean(),
  isVariantAxis: Joi.boolean(),
  useInFilter: Joi.boolean(),
  showOnProduct: Joi.boolean(),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
}).min(1)

export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  categoryId: objectId,
  brandId: objectId,
  deviceId: objectId,
  q: Joi.string().trim().max(200).allow(''),
  includeInactive: Joi.string().valid('true', 'false'),
})

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(180).required(),
  slug: Joi.string().trim().max(200),
  sku: Joi.string().trim().max(100).allow(''),
  shortDescription: Joi.string().trim().max(500).allow(''),
  description: Joi.string().trim().max(50000).allow(''),
  category: objectId.required(),
  brandId: objectId.allow(null, ''),
  deviceId: objectId.allow(null, ''),
  brand: Joi.string().trim().max(120).allow(''),
  tags: Joi.array().items(Joi.string().trim().max(80)).default([]),
  attributes: Joi.array().items(productAttributeSchema).default([]),
  images: Joi.array().items(imageSchema).default([]),
  variants: Joi.array().items(variantSchema).min(1).required(),
  seo: seoSchema.default({}),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
})

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(180),
  slug: Joi.string().trim().max(200),
  sku: Joi.string().trim().max(100).allow(''),
  shortDescription: Joi.string().trim().max(500).allow(''),
  description: Joi.string().trim().max(50000).allow(''),
  category: objectId,
  brandId: objectId.allow(null, ''),
  deviceId: objectId.allow(null, ''),
  brand: Joi.string().trim().max(120).allow(''),
  tags: Joi.array().items(Joi.string().trim().max(80)),
  attributes: Joi.array().items(productAttributeSchema),
  images: Joi.array().items(imageSchema),
  variants: Joi.array().items(variantSchema).min(1),
  seo: seoSchema,
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
}).min(1)

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const target = source === 'body' ? req.body : source === 'query' ? req.query : req.params
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    })

    if (error) {
      const message = error.details.map((d) => d.message.replace(/"/g, '')).join(', ')
      return next(new AppError(message, 400, errorCodes.VALIDATION_ERROR))
    }

    if (source === 'body') req.body = value
    else if (source === 'query') req.query = value
    else req.params = value

    return next()
  }
}
