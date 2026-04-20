import mongoose from 'mongoose'

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    /** Optional: homepage ribbon category this brand belongs to in admin catalog. */
    ribbonCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RibbonCategory',
      default: null,
    },
    /** Logo URL or data URL from admin. */
    imageUrl: { type: String, default: '', trim: true, maxlength: 500000 },
  },
  { timestamps: true },
)

brandSchema.index({ ribbonCategoryId: 1, sortOrder: 1 })

export const Brand = mongoose.model('Brand', brandSchema)
