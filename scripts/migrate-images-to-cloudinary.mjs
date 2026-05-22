/**
 * One-time: upload existing DB image URLs (data URLs, /hero paths, external HTTP) to Cloudinary.
 * Run: node scripts/migrate-images-to-cloudinary.mjs
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { logCloudinaryStatus } from '../src/config/cloudinary.js'
import { isCloudinaryUrl, persistImageToCloudinary } from '../src/utils/persistImageToCloudinary.js'
import { CLOUDINARY_FOLDERS } from '../src/constants/cloudinaryFolders.js'

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

const ping = await logCloudinaryStatus({ ping: true })
if (!ping.connected) {
  console.error('Cloudinary not connected — fix .env first')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db

async function migrateCollection(collName, field, folder, extraFilter = {}) {
  const coll = db.collection(collName)
  const cursor = coll.find({
    [field]: { $exists: true, $nin: ['', null] },
    ...extraFilter,
  })
  let n = 0
  for await (const doc of cursor) {
    const raw = String(doc[field] || '').trim()
    if (!raw || isCloudinaryUrl(raw)) continue
    try {
      const url = await persistImageToCloudinary(raw, folder)
      if (url && url !== raw) {
        await coll.updateOne({ _id: doc._id }, { $set: { [field]: url } })
        n += 1
        console.log(`  ${collName} ${doc._id} → ${url.slice(0, 72)}…`)
      }
    } catch (e) {
      console.warn(`  skip ${collName} ${doc._id}: ${e.message}`)
    }
  }
  console.log(`[${collName}.${field}] migrated ${n}`)
}

console.log('Migrating images to Cloudinary…')
await migrateCollection('services', 'imageUrl', CLOUDINARY_FOLDERS.homeServices)
await migrateCollection('homeservices', 'imageUrl', CLOUDINARY_FOLDERS.homeServices)
await migrateCollection('flashdeals', 'imageUrl', CLOUDINARY_FOLDERS.flashDeals)
await migrateCollection('ribboncategories', 'imageUrl', CLOUDINARY_FOLDERS.ribbon)
await migrateCollection('banners', 'imageUrl', CLOUDINARY_FOLDERS.banners)
await migrateCollection('brands', 'imageUrl', CLOUDINARY_FOLDERS.brands)
await migrateCollection('branddevices', 'imageUrl', CLOUDINARY_FOLDERS.devices)
await migrateCollection('phonemodels', 'image', CLOUDINARY_FOLDERS.models)

await mongoose.disconnect()
console.log('Done.')
