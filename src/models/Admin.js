import mongoose from 'mongoose'

/** Staff accounts — separate collection from end-user `User` records. */
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },
    phone: { type: String, trim: true, sparse: true, default: '' },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'],
      default: 'admin',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true },
)


export const Admin = mongoose.model('Admin', adminSchema)
