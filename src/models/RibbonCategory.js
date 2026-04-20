import mongoose from 'mongoose'

/** Homepage horizontal category ribbon — icons are Lucide keys (see frontend ICON_MAP). */
const RIBBON_ICON_KEYS = [
  'smartphone',
  'watch',
  'tv',
  'wind',
  'laptop',
  'sparkles',
  'headphones',
  'tablet',
  'gift',
  'cpu',
]

const ribbonCategorySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, default: '/marketplace', trim: true },
    /** Optional hero image for admin catalog cards (URL or data URL). */
    imageUrl: { type: String, default: '', trim: true, maxlength: 500000 },
    iconKey: { type: String, required: true, enum: RIBBON_ICON_KEYS },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

ribbonCategorySchema.index({ isActive: 1, sortOrder: 1 })

export const RibbonCategory = mongoose.model('RibbonCategory', ribbonCategorySchema)
export { RIBBON_ICON_KEYS }
