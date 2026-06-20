import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    quantity: { type: Number, required: true, default: 1, min: 1, max: 1 },
    unitPriceInr: { type: Number, required: true, min: 0 },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    conditionGrade: { type: String, default: '' },
    reservedUntil: { type: Date },
  },
  { _id: false },
)

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
)

cartSchema.index({ userId: 1 })
cartSchema.index({ 'items.inventoryId': 1 })
cartSchema.index({ 'items.productId': 1 })

cartItemSchema.pre('validate', function requireLineRef(next) {
  if (!this.inventoryId && !this.productId) {
    this.invalidate('inventoryId', 'Either inventoryId or productId is required')
  }
  next()
})

export const Cart = mongoose.model('Cart', cartSchema)
