import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Admin } from './src/models/Admin.js'
import { User } from './src/models/User.js'
import { Address } from './src/models/Address.js'
import { Banner } from './src/models/Banner.js'
import { Brand } from './src/models/Brand.js'
import { Coupon } from './src/models/Coupon.js'
import { DeviceCondition } from './src/models/DeviceCondition.js'
import { Inventory } from './src/models/Inventory.js'
import { Order } from './src/models/Order.js'
import { OtpChallenge } from './src/models/OtpChallenge.js'
import { Payment } from './src/models/Payment.js'
import { PhoneModel } from './src/models/PhoneModel.js'
import { Pickup } from './src/models/Pickup.js'
import { RibbonCategory } from './src/models/RibbonCategory.js'
import { Variant } from './src/models/Variant.js'

const models = { 
  Address, Admin, Banner, Brand, Coupon, DeviceCondition, 
  Inventory, Order, OtpChallenge, Payment, PhoneModel, 
  Pickup, RibbonCategory, User, Variant 
}

async function createDefaultAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/baskaro'
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected.')

    console.log('Initializing collections and indexes...')
    for (const [name, model] of Object.entries(models)) {
      if (model.syncIndexes) {
        await model.syncIndexes()
      }
    }
    console.log('All collections and indexes are ready.')

    const email = 'admin@gmail.com'
    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      console.log('Admin already exists in Admin collection')
      return
    }

    const userWithEmail = await User.findOne({ email })
    if (userWithEmail) {
      if (!userWithEmail.passwordHash) {
        console.log(
          'A User with this email exists but has no password hash. Delete that user or set a password, then re-run.',
        )
        return
      }
      await Admin.create({
        name: userWithEmail.name || 'Admin',
        email,
        phone: userWithEmail.phone || '9011757177',
        passwordHash: userWithEmail.passwordHash,
        role: 'admin',
      })
      await User.updateOne({ _id: userWithEmail._id }, { $unset: { email: 1 } })
      console.log(
        'Migrated legacy admin: Admin document created; email removed from User row (same _id for existing orders).',
      )
      return
    }

    const hashedPassword = await bcrypt.hash('admin@123', 10)

    await Admin.create({
      name: 'Admin',
      email,
      phone: '9011757177',
      passwordHash: hashedPassword,
      role: 'admin',
    })

    console.log('Default admin created successfully (Admin collection)')
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await mongoose.disconnect()
  }
}

createDefaultAdmin()
