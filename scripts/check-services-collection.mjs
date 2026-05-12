/**
 * List Mongo `services` collection (homepage items) and legacy `homeservices` if present.
 * Run: node scripts/check-services-collection.mjs
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

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI not set')
  process.exit(1)
}

await mongoose.connect(uri)
const db = mongoose.connection.db
const all = (await db.listCollections().toArray()).map((c) => c.name).sort()

const collName = HomeService.collection.collectionName
console.log('Mongoose model collection name:', collName)
console.log('Collection "services" exists:', all.includes('services'))
console.log('Legacy "homeservices" exists:', all.includes('homeservices'))

if (all.includes(collName)) {
  const n = await HomeService.countDocuments({})
  const active = await HomeService.countDocuments({ isActive: true })
  console.log(`"${collName}" document count (total):`, n)
  console.log(`"${collName}" document count (isActive: true):`, active)
}

await mongoose.disconnect()
console.log('Done.')
