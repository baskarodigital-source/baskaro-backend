import mongoose from 'mongoose'

function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const attributeValueSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 120 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
)

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, trim: true, lowercase: true, maxlength: 120 },
    type: {
      type: String,
      enum: ['select', 'multiselect', 'text', 'number', 'boolean', 'media'],
      default: 'select',
      trim: true,
    },
    categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    ],
    values: { type: [attributeValueSchema], default: [] },
    isRequired: { type: Boolean, default: false },
    isVariantAxis: { type: Boolean, default: false },
    useInFilter: { type: Boolean, default: true },
    showOnProduct: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'attributes' },
)

attributeSchema.pre('validate', function normalizeCode(next) {
  if (!this.code && this.name) {
    this.code = slugify(this.name)
  } else if (this.code) {
    this.code = slugify(this.code)
  }
  next()
})

attributeSchema.path('categories').validate(function hasCategory(value) {
  return Array.isArray(value) && value.length > 0
}, 'categories must contain at least one category id')

attributeSchema.index({ code: 1, categories: 1 }, { unique: true })
attributeSchema.index({ categories: 1, isActive: 1, sortOrder: 1 })
attributeSchema.index({ isVariantAxis: 1, isActive: 1 })

export const Attribute = mongoose.model('Attribute', attributeSchema)
export default Attribute
