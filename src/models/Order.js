import mongoose from 'mongoose'

const statusValues = [
  'PLACED',
  'PICKUP_SCHEDULED',
  'VERIFIED',
  'PRICE_FINALIZED',
  'COMPLETED',
  'CANCELLED'
]

const conditionGrades = ['EXCELLENT', 'GOOD', 'AVERAGE', 'BROKEN']

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: statusValues },
    at: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, default: '' }
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Device details
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneModel', required: true },
    brand: { type: String, required: true, trim: true },
    modelName: { type: String, required: true, trim: true },
    storage: { type: String, required: true, trim: true },
    ram: { type: String, required: true, trim: true },

    // Condition assessment
    condition: { 
      type: String, 
      required: true, 
      enum: conditionGrades 
    },
    screenCondition: { type: String, required: true },
    bodyCondition: { type: String, required: true },
    batteryHealth: { type: String, required: true },
    accessories: { type: String, required: true },

    // Pricing
    basePrice: { type: Number, required: true, min: 0 },
    calculatedPrice: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    deductions: {
      screen: { type: Number, default: 0 },
      battery: { type: Number, default: 0 },
      camera: { type: Number, default: 0 },
      faceId: { type: Number, default: 0 }
    },

    // Pickup details
    pickupDate: { type: String, required: true },
    pickupTime: { type: String, required: true },

    address: {
      label: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, required: true },
    },

    // Payment
    payMethod: { type: String, enum: ['UPI', 'BANK', 'WALLET'] },
    paymentDetails: {
      upiId: { type: String, default: '' },
      accountNo: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },

    status: { 
      type: String, 
      required: true, 
      enum: statusValues, 
      default: 'PLACED' 
    },
    statusHistory: { type: [statusHistorySchema], default: [] },

    // Optional metadata
    agentAssignment: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ brandId: 1 })
orderSchema.index({ modelId: 1 })

export const Order = mongoose.model('Order', orderSchema)
export const ORDER_STATUS_VALUES = statusValues
export const CONDITION_GRADES = conditionGrades

