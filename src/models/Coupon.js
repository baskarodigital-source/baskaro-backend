import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      trim: true, 
      uppercase: true,
      unique: true
    },
    description: { type: String, default: '' },
    discountPercent: { 
      type: Number, 
      required: true, 
      min: 0, 
      max: 100 
    },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    applicableFor: { 
      type: String, 
      enum: ['ALL', 'NEW_USER', 'EXISTING_USER'],
      default: 'ALL'
    },
  },
  { timestamps: true },
)


couponSchema.index({ isActive: 1 })

export const Coupon = mongoose.model('Coupon', couponSchema)
