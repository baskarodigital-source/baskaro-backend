import mongoose from 'mongoose'

/** Homepage “Our Services” items — stored in MongoDB collection `services`. */
const homeServiceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    path: { type: String, required: true, trim: true, maxlength: 200 },
    /** Optional icon/thumb URL or data URL from admin upload */
    imageUrl: { type: String, default: '', trim: true, maxlength: 1_000_000 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'services' },
)

homeServiceSchema.index({ isActive: 1, sortOrder: 1 })

export const HomeService = mongoose.model('HomeService', homeServiceSchema)

