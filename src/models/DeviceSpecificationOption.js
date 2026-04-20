import mongoose from 'mongoose'

const deviceSpecificationOptionSchema = new mongoose.Schema(
  {
    specId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceSpecificationMaster',
      required: true,
      index: true,
    },
    value: { type: String, required: true, trim: true },
    valueLower: { type: String, required: true, trim: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

deviceSpecificationOptionSchema.index({ specId: 1, valueLower: 1 }, { unique: true })
deviceSpecificationOptionSchema.index({ specId: 1, sortOrder: 1 })

export const DeviceSpecificationOption = mongoose.model('DeviceSpecificationOption', deviceSpecificationOptionSchema)

