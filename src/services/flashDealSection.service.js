import { FlashDealSection } from '../models/FlashDealSection.js'

const KEY = 'home_flash_deals'
const DEFAULT_TITLE = 'Hurry Up! Get Up to 40% Off'

export async function getSection() {
  const doc = await FlashDealSection.findOne({ key: KEY }).lean()
  if (doc) return doc
  // No auto-create here; keep DB clean until admin saves.
  return { key: KEY, title: DEFAULT_TITLE }
}

export async function upsertSection({ title }) {
  const t = String(title || '').trim()
  const nextTitle = t || DEFAULT_TITLE
  const updated = await FlashDealSection.findOneAndUpdate(
    { key: KEY },
    { $set: { title: nextTitle } },
    { upsert: true, new: true },
  ).lean()
  return updated
}

