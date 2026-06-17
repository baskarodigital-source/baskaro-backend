import mongoose from 'mongoose'

export const PURCHASE_ORDER_STATUS_VALUES = [
  'PLACED',
  'PAYMENT_PENDING',
  'PAID',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const lineItemSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneModel' },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    conditionGrade: { type: String, default: '' },
    unitPriceInr: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { _id: false },
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: PURCHASE_ORDER_STATUS_VALUES },
    at: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, default: '' },
  },
  { _id: false },
)

const purchaseOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, required: true, unique: true, trim: true },
    lineItems: { type: [lineItemSchema], required: true, validate: [(v) => v?.length > 0, 'At least one line item'] },
    subtotalInr: { type: Number, required: true, min: 0 },
    taxInr: { type: Number, required: true, min: 0, default: 0 },
    totalInr: { type: Number, required: true, min: 0 },
    address: {
      label: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: PURCHASE_ORDER_STATUS_VALUES,
      default: 'PLACED',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
)

purchaseOrderSchema.index({ userId: 1, createdAt: -1 })
purchaseOrderSchema.index({ status: 1 })
purchaseOrderSchema.index({ orderNumber: 1 })

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema)
