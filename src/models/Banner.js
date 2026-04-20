import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String, default: '' },
    /** Hero carousel line under the title (HOME_HERO). */
    subtitle: { type: String, default: '', trim: true },
    /** Hero CTA label (HOME_HERO). */
    buttonText: { type: String, default: '', trim: true },
    /** Tailwind background class for hero panel, e.g. bg-blue-50 (HOME_HERO). */
    bgClass: { type: String, default: 'bg-blue-50', trim: true },
    position: { 
      type: String, 
      enum: ['HOME_HERO', 'HOME_TOP', 'HOME_MIDDLE', 'HOME_BOTTOM', 'CATEGORY', 'PRODUCT'],
      default: 'HOME_TOP'
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
)

bannerSchema.index({ position: 1 })
bannerSchema.index({ isActive: 1 })

export const Banner = mongoose.model('Banner', bannerSchema)
