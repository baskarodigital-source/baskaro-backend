import mongoose from 'mongoose'

function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const categorySeoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 320, default: '' },
    keywords: [{ type: String, trim: true, maxlength: 80 }],
  },
  { _id: false },
)

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 150 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    icon: { type: String, trim: true, default: null },
    image: { type: String, trim: true, default: null },
    seo: { type: categorySeoSchema, default: () => ({}) },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ribbonCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RibbonCategory',
      default: null,
    },
  },
  { timestamps: true, collection: 'categories' },
)

categorySchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name)
  } else if (this.slug) {
    this.slug = slugify(this.slug)
  }
  next()
})

categorySchema.index({ slug: 1 }, { unique: true })
categorySchema.index({ parent: 1, sortOrder: 1, name: 1 })
categorySchema.index({ ancestors: 1 })
categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 })
 categorySchema.index({ ribbonCategoryId: 1 }, { sparse: true })

export const Category = mongoose.model('Category', categorySchema)
export default Category

