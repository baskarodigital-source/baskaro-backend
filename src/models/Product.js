import mongoose from 'mongoose'

function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    publicId: { type: String, trim: true, maxlength: 255, default: '' },
    alt: { type: String, trim: true, maxlength: 180, default: '' },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
)

const productAttributeValueSchema = new mongoose.Schema(
  {
    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
    },
    code: { type: String, trim: true, maxlength: 120, default: '' },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
)

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, maxlength: 80, default: '' },
    title: { type: String, trim: true, maxlength: 180, default: '' },
    condition: { type: String, trim: true, maxlength: 80, default: '' },
    attributes: { type: [productAttributeValueSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    images: { type: [imageSchema], default: [] },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
)

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 320, default: '' },
    keywords: [{ type: String, trim: true, maxlength: 80 }],
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 200 },
    sku: { type: String, trim: true, maxlength: 100, default: '' },
    shortDescription: { type: String, trim: true, maxlength: 500, default: '' },
    description: { type: String, trim: true, maxlength: 50000, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandDevice', default: null, index: true },
    brand: { type: String, trim: true, maxlength: 120, default: '' },
    tags: { type: [String], default: [] },
    attributes: { type: [productAttributeValueSchema], default: [] },
    images: { type: [imageSchema], default: [] },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one variant is required',
      },
      required: true,
    },
    seo: { type: seoSchema, default: () => ({}) },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'products' },
)

productSchema.pre('validate', function normalizeFields(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name)
  } else if (this.slug) {
    this.slug = slugify(this.slug)
  }

  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((x) => String(x || '').trim()).filter(Boolean))]
  }

  if (Array.isArray(this.images) && this.images.length > 0) {
    const hasPrimary = this.images.some((img) => img?.isPrimary)
    if (!hasPrimary && this.images[0]) this.images[0].isPrimary = true
  }

  if (Array.isArray(this.variants) && this.variants.length > 0) {
    const hasDefault = this.variants.some((v) => v?.isDefault)
    if (!hasDefault && this.variants[0]) this.variants[0].isDefault = true
  }

  next()
})

productSchema.index({ slug: 1 }, { unique: true })
productSchema.index({ sku: 1 }, { sparse: true })
productSchema.index({ category: 1, isActive: 1, createdAt: -1 })
productSchema.index({ brandId: 1, deviceId: 1, isActive: 1 })
productSchema.index({ isFeatured: 1, isActive: 1, createdAt: -1 })
productSchema.index({ name: 'text', brand: 'text', shortDescription: 'text' })

export const Product = mongoose.model('Product', productSchema)
export default Product
