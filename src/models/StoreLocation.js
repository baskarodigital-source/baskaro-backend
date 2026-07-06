import mongoose from 'mongoose'

const storeLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, default: '', trim: true, maxlength: 80 },
    address: { type: String, default: '', trim: true, maxlength: 300 },
    distanceLabel: { type: String, default: '', trim: true, maxlength: 40 },
    imageUrl: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true, maxlength: 30 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'store_locations' },
)

storeLocationSchema.index({ isActive: 1, sortOrder: 1 })

export const StoreLocation = mongoose.model('StoreLocation', storeLocationSchema)
