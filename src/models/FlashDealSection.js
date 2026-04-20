import mongoose from 'mongoose'

/**
 * Singleton settings for homepage Flash Deals block.
 * Stores only UI copy that should be admin-editable.
 */
const flashDealSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true },
)

export const FlashDealSection = mongoose.model('FlashDealSection', flashDealSectionSchema)

