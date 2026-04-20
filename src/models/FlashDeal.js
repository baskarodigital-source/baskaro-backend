import mongoose from 'mongoose'

/** Homepage “Hurry Up” product cards — managed from Admin → Offers & Coupons. */
const flashDealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    /** HTTPS URL or data URL from admin upload */
    imageUrl: { type: String, required: true, trim: true, maxlength: 2_000_000 },
    mrpInr: { type: Number, required: true, min: 0 },
    salePriceInr: { type: Number, required: true, min: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    linkUrl: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

flashDealSchema.index({ isActive: 1, sortOrder: 1 })

export const FlashDeal = mongoose.model('FlashDeal', flashDealSchema)
