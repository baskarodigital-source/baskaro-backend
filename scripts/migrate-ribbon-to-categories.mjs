/**
 * Copy ribbon categories (All Categories admin) into catalog builder `categories` collection.
 * Skips ribbons whose slug already exists in categories.
 *
 * Run: node scripts/migrate-ribbon-to-categories.mjs
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { RibbonCategory } from '../src/models/RibbonCategory.js'
import { Category } from '../src/models/Category.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
for (const f of ['.env', 'src/.env']) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
    break
  }
}

function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueSlug(base) {
  const rootSlug = slugify(base)
  if (!rootSlug) return rootSlug
  let attempt = rootSlug
  let n = 2
  while (await Category.findOne({ slug: attempt }).select('_id').lean()) {
    attempt = `${rootSlug}-${n++}`
  }
  return attempt
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)

const ribbons = await RibbonCategory.find({}).sort({ sortOrder: 1, label: 1 }).lean()
if (!ribbons.length) {
  console.log('No ribbon categories found. Nothing to import.')
  await mongoose.disconnect()
  process.exit(0)
}

let created = 0
let skipped = 0

for (const ribbon of ribbons) {
  const name = String(ribbon.label || '').trim()
  if (!name) {
    skipped += 1
    continue
  }

  const slug = await uniqueSlug(name)
  const exists = await Category.findOne({ slug }).select('_id').lean()
  if (exists) {
    console.log(`skip: ${name} (slug ${slug} already exists)`)
    skipped += 1
    continue
  }

  await Category.create({
    name,
    slug,
    parent: null,
    ancestors: [],
    icon: ribbon.iconKey || null,
    image: ribbon.imageUrl || null,
    sortOrder: Number(ribbon.sortOrder) || 0,
    isActive: ribbon.isActive !== false,
  })
  console.log(`created: ${name} -> ${slug}`)
  created += 1
}

console.log(`Done. created=${created}, skipped=${skipped}`)
await mongoose.disconnect()
