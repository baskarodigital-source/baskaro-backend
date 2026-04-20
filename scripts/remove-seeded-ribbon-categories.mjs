/**
 * One-time cleanup: removes legacy seeded ribbon rows (by label).
 * Usage (from backend/): node scripts/remove-seeded-ribbon-categories.mjs
 */
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { RibbonCategory } from '../src/models/RibbonCategory.js'

const LABELS_TO_REMOVE = [
  'Smart Watches',
  'Smart TVs',
  'Air Conditioner',
  'Laptops',
  'Personal Care',
  'Accessories',
  'Tablets',
  'Gift cards',
  'Smart gadgets',
]

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/baskaro'

await mongoose.connect(uri)

const result = await RibbonCategory.deleteMany({
  label: { $in: LABELS_TO_REMOVE },
})

console.log('Deleted ribbon categories:', result.deletedCount, 'matching labels:', LABELS_TO_REMOVE)

await mongoose.disconnect()
