import { ServicePageContent } from '../models/ServicePageContent.js'
import { DEFAULT_REPAIR_WHY_US_ITEMS } from '../constants/defaultRepairWhyUs.js'
import { DEFAULT_SELL_PHONE_WHY_US_ITEMS } from '../constants/defaultSellPhoneWhyUs.js'

export async function getPublicByPageKey(pageKey) {
  const key = String(pageKey || '')
    .trim()
    .toLowerCase()
  if (!key) return { pageKey: '', whyUsItems: [] }

  let doc = await ServicePageContent.findOne({ pageKey: key }).lean()
  if (doc) {
    return {
      pageKey: doc.pageKey,
      whyUsItems: sortWhyUs(doc.whyUsItems),
    }
  }

  if (key === 'repair-phone' || key === 'sell-phone') {
    const seedItems = key === 'sell-phone' ? DEFAULT_SELL_PHONE_WHY_US_ITEMS : DEFAULT_REPAIR_WHY_US_ITEMS
    try {
      await ServicePageContent.create({
        pageKey: key,
        whyUsItems: seedItems,
      })
    } catch {
      /* race: another request may have inserted */
    }
    doc = await ServicePageContent.findOne({ pageKey: key }).lean()
    if (doc) {
      return {
        pageKey: doc.pageKey,
        whyUsItems: sortWhyUs(doc.whyUsItems),
      }
    }
  }

  return { pageKey: key, whyUsItems: [] }
}

function sortWhyUs(items) {
  if (!Array.isArray(items)) return []
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}
