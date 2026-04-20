import mongoose from 'mongoose'

const variantSchema = new mongoose.Schema(
  {
    phoneModelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhoneModel',
      required: true,
    },
    label: { type: String, required: true, trim: true },
    ramGb: { type: Number, required: true },
    storageGb: { type: Number, required: true },
    // delta used by the pricing engine on top of PhoneModel.basePriceInr
    priceDeltaInr: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

variantSchema.index({ phoneModelId: 1 })

export const Variant = mongoose.model('Variant', variantSchema)
