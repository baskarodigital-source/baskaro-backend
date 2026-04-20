import mongoose from 'mongoose'

const brandDeviceSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    imageUrl: { type: String, default: '', trim: true, maxlength: 500000 },
  },
  { timestamps: true },
)

brandDeviceSchema.index({ brandId: 1, slug: 1 }, { unique: true })
brandDeviceSchema.index({ brandId: 1, sortOrder: 1 })

export const BrandDevice = mongoose.model('BrandDevice', brandDeviceSchema)

