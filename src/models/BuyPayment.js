import mongoose from 'mongoose'

const buyPaymentSchema = new mongoose.Schema(
  {
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      unique: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountInr: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    gatewayResponse: { type: Object, default: {} },
    paidAt: { type: Date },
  },
  { timestamps: true },
)

buyPaymentSchema.index({ userId: 1 })
buyPaymentSchema.index({ razorpayOrderId: 1 })
buyPaymentSchema.index({ status: 1 })

export const BuyPayment = mongoose.model('BuyPayment', buyPaymentSchema)
