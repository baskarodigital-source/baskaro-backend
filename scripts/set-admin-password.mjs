import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../src/models/User.js'

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/baskaro'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com'
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123'

await mongoose.connect(MONGO_URI)

const hash = await bcrypt.hash(PASSWORD, 10)
const res = await User.updateOne(
  { email: EMAIL },
  { $set: { passwordHash: hash, role: 'admin' } },
)

const user = await User.findOne({ email: EMAIL }).lean()

console.log({
  matchedCount: res.matchedCount,
  modifiedCount: res.modifiedCount,
  hasPasswordHash: !!user?.passwordHash,
  role: user?.role,
})

await mongoose.disconnect()

