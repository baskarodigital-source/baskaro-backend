import mongoose from 'mongoose'

const pickupSchema = new mongoose.Schema(
  {
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order', 
      required: true,
      unique: true
    },
    address: {
      label: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, required: true },
    },
    scheduledDate: { type: String, required: true }, // yyyy-mm-dd
    scheduledTime: { type: String, required: true }, // time slot
    agentName: { type: String, default: '' },
    agentPhone: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
)


pickupSchema.index({ scheduledDate: 1 })

export const Pickup = mongoose.model('Pickup', pickupSchema)
