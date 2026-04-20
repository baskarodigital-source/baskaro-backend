import mongoose from 'mongoose'

const FIELD_TYPES = ['text', 'number', 'dropdown', 'boolean']

const deviceSpecificationMasterSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandDevice',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true, trim: true, lowercase: true },
    key: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: FIELD_TYPES },
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

deviceSpecificationMasterSchema.index({ deviceId: 1, nameLower: 1 }, { unique: true })
deviceSpecificationMasterSchema.index({ deviceId: 1, sortOrder: 1 })

export const DeviceSpecificationMaster = mongoose.model('DeviceSpecificationMaster', deviceSpecificationMasterSchema)
export { FIELD_TYPES }

