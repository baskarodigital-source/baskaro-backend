import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    // Customer accounts only — staff live in `Admin` collection.
    role: {
      type: String,
      enum: ['user'],
      default: 'user',
    },
    totalOrders: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'BLOCKED'], 
      default: 'ACTIVE' 
    },
    // Local auth (email/password). For OTP-only users this can be null.
    passwordHash: { type: String, default: null },
  },
  { timestamps: true },
)


export const User = mongoose.model('User', userSchema)
