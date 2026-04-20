import mongoose from 'mongoose'

const otpChallengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    phone: { type: String, required: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

otpChallengeSchema.index({ phone: 1, expiresAt: 1 })

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema)

