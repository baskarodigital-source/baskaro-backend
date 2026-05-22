/**
 * Rewrites `services.imageUrl` values that point at cashify.in to local `/hero/*` assets.
 * Run once after deploy: node scripts/update-service-images-remove-cashify.mjs
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
for (const f of ['.env', 'src/.env']) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
    break
  }
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set')
  process.exit(1)
}

const REPAIR_PHONE_IMAGE =
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=640&auto=format&fit=crop'

const BY_LABEL = {
  'Sell Phone': '/hero/sell.png',
  'Buy Phone': '/hero/buy.png',
  'Find New Phone': '/hero/exchange.png',
  'New Accessories': '/hero/accessories.png',
  'Repair Phone': REPAIR_PHONE_IMAGE,
}

await mongoose.connect(process.env.MONGODB_URI)
const coll = mongoose.connection.db.collection('services')
const cursor = coll.find({
  $or: [
    { imageUrl: { $regex: /cashify/i } },
    { imageUrl: { $regex: /erepaircafe/i } },
  ],
})
let n = 0
for await (const doc of cursor) {
  const next = BY_LABEL[doc.label] || '/hero/sell.png'
  await coll.updateOne({ _id: doc._id }, { $set: { imageUrl: next } })
  n += 1
}
console.log(`Updated ${n} service document(s) with non-Cashify image URLs.`)
await mongoose.disconnect()
