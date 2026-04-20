import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema(
  {
    modelId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PhoneModel', 
      required: true 
    },
    brandId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Brand', 
      required: true 
    },
    conditionGrade: { 
      type: String, 
      enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'BROKEN'],
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    specifications: {
      display: { type: String, default: '' },
      processor: { type: String, default: '' },
      camera: { type: String, default: '' },
      battery: { type: String, default: '' },
    },
    images: [String],
    isSold: { type: Boolean, default: false },
    soldAt: { type: Date },
  },
  { timestamps: true },
)

inventorySchema.index({ modelId: 1 })
inventorySchema.index({ brandId: 1 })
inventorySchema.index({ conditionGrade: 1 })
inventorySchema.index({ isSold: 1 })

export const Inventory = mongoose.model('Inventory', inventorySchema)
