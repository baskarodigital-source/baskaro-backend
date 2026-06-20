import mongoose from 'mongoose'

/**
 * Marketing offers shown on product details page ("Available Offers").
 * Can be global (modelId=null) or model-specific.
 */
const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    desc: { type: String, required: true, trim: true, maxlength: 220 },
    code: { type: String, default: '', trim: true, uppercase: true, maxlength: 30 },
    /** Optional: limit this offer to a specific phone model */
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneModel', default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

offerSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 })
offerSchema.index({ modelId: 1, isActive: 1, sortOrder: 1 })
offerSchema.index({ productId: 1, isActive: 1, sortOrder: 1 })

export const Offer = mongoose.model('Offer', offerSchema)

