import mongoose from 'mongoose'

const deviceConditionSchema = new mongoose.Schema(
  {
    condition: { 
      type: String, 
      required: true, 
      enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BROKEN'],
      unique: true
    },
    description: { type: String, default: '' },
    deductions: {
      screen: { type: Number, default: 0, min: 0 },
      battery: { type: Number, default: 0, min: 0 },
      camera: { type: Number, default: 0, min: 0 },
      faceId: { type: Number, default: 0, min: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const DeviceCondition = mongoose.model('DeviceCondition', deviceConditionSchema)
