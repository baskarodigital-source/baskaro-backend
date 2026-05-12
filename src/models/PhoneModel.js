import mongoose from 'mongoose'

const phoneModelSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    /** Sub-category under brand (e.g. Watch, Bluetooth). */
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandDevice',
      default: null,
    },
    modelName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    storageVariants: [
      {
        label: { type: String, required: true }, // e.g., "128GB", "256GB"
        basePrice: { type: Number, required: true, min: 0 },
        ram: { type: String, required: true }, // e.g., "6GB", "8GB"
      }
    ],
    basePrice: { type: Number, required: true, min: 0 }, // Base price for the model
    image: { type: String, default: '' },
    /** Dynamic spec bag; shape is driven by /api/specifications/:categoryId. */
    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    releaseYear: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

phoneModelSchema.index({ brandId: 1 })
phoneModelSchema.index({ deviceId: 1 })
phoneModelSchema.index({ slug: 1 })

export const PhoneModel = mongoose.model('PhoneModel', phoneModelSchema)
