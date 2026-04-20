import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order', 
      required: true,
      unique: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { type: Number, required: true, min: 0 },
    method: { 
      type: String, 
      enum: ['UPI', 'BANK', 'WALLET'],
      required: true
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    transactionId: { type: String, default: '' },
    paymentGatewayResponse: { type: Object, default: {} },
    paidAt: { type: Date },
  },
  { timestamps: true },
)


paymentSchema.index({ userId: 1 })
paymentSchema.index({ status: 1 })

export const Payment = mongoose.model('Payment', paymentSchema)
