/**
 * Copy documents from legacy collection `homeservices` into `services` if `services` is empty.
 * Normally automatic on first GET /api/home-services after deploy; run manually if needed.
 *
 * Run: node scripts/migrate-homeservices-to-services.mjs
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { HomeService } from '../src/models/HomeService.js'

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

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db
const legacy = 'homeservices'

const newCount = await HomeService.countDocuments({})
if (newCount > 0) {
  console.log(`"${HomeService.collection.collectionName}" already has ${newCount} document(s). Nothing to do.`)
  await mongoose.disconnect()
  process.exit(0)
}

const hasLegacy = (await db.listCollections({ name: legacy }).toArray()).length > 0
if (!hasLegacy) {
  console.log('No legacy homeservices collection. Seed will run on next API read if still empty.')
  await mongoose.disconnect()
  process.exit(0)
}

const raw = await db.collection(legacy).find({}).toArray()
if (!raw.length) {
  console.log('Legacy homeservices is empty.')
  await mongoose.disconnect()
  process.exit(0)
}

const payload = raw.map((d) => ({
  _id: d._id,
  label: d.label,
  path: d.path,
  imageUrl: d.imageUrl ?? '',
  sortOrder: d.sortOrder ?? 0,
  isActive: d.isActive !== false,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
}))

await HomeService.insertMany(payload)
console.log(`Copied ${payload.length} document(s) from "${legacy}" → "${HomeService.collection.collectionName}".`)

await mongoose.disconnect()
