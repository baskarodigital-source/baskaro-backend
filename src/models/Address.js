import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'Home', trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '' },
    pincode: { type: String, required: true, trim: true }, // keep as string to preserve leading zeros
  },
  { timestamps: true },
)

addressSchema.index({ userId: 1 })

export const Address = mongoose.model('Address', addressSchema)

