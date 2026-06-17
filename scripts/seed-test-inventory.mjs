/**
 * Create or reset one sellable pre-owned inventory unit for local checkout testing.
 *
 * Run from backend/:  node scripts/seed-test-inventory.mjs
 *
 * Optional env:
 *   SEED_MODEL_ID          — PhoneModel _id (defaults to latest active model)
 *   SEED_PRICE             — INR price (default 24999)
 *   SEED_CONDITION_GRADE   — EXCELLENT | GOOD | AVERAGE | BROKEN (default EXCELLENT)
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { Inventory } from '../src/models/Inventory.js'
import { PhoneModel } from '../src/models/PhoneModel.js'
import { Brand } from '../src/models/Brand.js'

const SEED_MARKER = '__BASKARO_SEED_TEST_UNIT__'
const GRADES = new Set(['EXCELLENT', 'GOOD', 'AVERAGE', 'BROKEN'])

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

const price = Number(process.env.SEED_PRICE) || 24999
const gradeRaw = String(process.env.SEED_CONDITION_GRADE || 'EXCELLENT').toUpperCase()
const conditionGrade = GRADES.has(gradeRaw) ? gradeRaw : 'EXCELLENT'

await mongoose.connect(uri)

let model = null
const modelId = String(process.env.SEED_MODEL_ID || '').trim()
if (modelId) {
  if (!mongoose.Types.ObjectId.isValid(modelId)) {
    console.error('SEED_MODEL_ID is not a valid ObjectId')
    process.exit(1)
  }
  model = await PhoneModel.findById(modelId).lean()
  if (!model) {
    console.error(`No PhoneModel found for SEED_MODEL_ID=${modelId}`)
    process.exit(1)
  }
} else {
  model = await PhoneModel.findOne({ active: { $ne: false } }).sort({ createdAt: -1 }).lean()
  if (!model) {
    model = await PhoneModel.findOne().sort({ createdAt: -1 }).lean()
  }
  if (!model) {
    console.error('No PhoneModel in database. Add a catalog model first (Admin → All Categories).')
    process.exit(1)
  }
}

const images = []
const modelImage = String(model.image || '').trim()
if (modelImage) images.push(modelImage)
else if (Array.isArray(model.images) && model.images[0]) {
  images.push(String(model.images[0]).trim())
}

const baseDoc = {
  modelId: model._id,
  brandId: model.brandId,
  conditionGrade,
  price,
  stock: 1,
  isSold: false,
  specifications: {
    display: '6.1" OLED (seed test unit)',
    processor: SEED_MARKER,
    camera: '48MP (seed)',
    battery: '4000mAh',
  },
  images,
}

let row = await Inventory.findOne({ 'specifications.processor': SEED_MARKER })
let action = 'updated'

if (row) {
  row.set(baseDoc)
  row.reservedUntil = undefined
  row.reservedBy = undefined
  row.soldAt = undefined
  await row.save()
} else {
  row = await Inventory.create(baseDoc)
  action = 'created'
}

await row.populate([
  { path: 'modelId', select: 'modelName slug' },
  { path: 'brandId', select: 'name slug' },
])

const invId = String(row._id)
const slug = String(row.modelId?.slug || model.slug || '').trim()
const modelName = String(row.modelId?.modelName || model.modelName || '').trim()
const brandName = String(row.brandId?.name || '').trim()
const modelOid = String(model._id)
const productPath =
  slug && invId
    ? `/buy-pre-owned/product/phone/${encodeURIComponent(slug)}/${encodeURIComponent(invId)}${
        modelOid ? `?modelId=${encodeURIComponent(modelOid)}` : ''
      }`
    : ''

console.log({
  action,
  inventoryId: invId,
  title: `${brandName} ${modelName}`.trim(),
  conditionGrade,
  price,
  stock: row.stock,
  isSold: row.isSold,
  modelId: modelOid,
  productPath,
  hint: 'Log in on the storefront, open productPath, Add to cart → Cart → Pay.',
})

await mongoose.disconnect()
console.log('Done.')
