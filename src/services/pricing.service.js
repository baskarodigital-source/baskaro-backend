import { Brand } from '../models/Brand.js'
import { PhoneModel } from '../models/PhoneModel.js'

// ─────────────────────────────────────────────────────────────────────────────
// BASKARO pricing system (v2)
// Offer Price = (Base Market Price × Demand Factor) – Depreciation – Condition Loss – Repair Buffer – Profit Margin
// ─────────────────────────────────────────────────────────────────────────────

const CONDITION_LOSS_INR = {
  screenCondition: {
    Excellent: 0,
    Good: 0,
    Fair: 1000, // Scratch
    'Bad / Cracked': 5000, // Broken
  },
  bodyCondition: {
    Excellent: 0,
    Good: 0,
    Fair: 800, // Scratch
    'Bad / Scratched': 2000, // Heavy damage
  },
  batteryHealth: {
    '90% - 100%': 0,
    '80% - 89%': 0,
    '60% - 79%': 1200, // Weak
    'Below 60%': 1200, // Weak (cap at given rule)
  },
}

const DEFAULT_REPAIR_BUFFER_INR = 1500
const DEFAULT_PROFIT_MARGIN_INR = 3000

function clampInt(n, min, max) {
  const v = Number(n)
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, Math.round(v)))
}

function depreciationPctByAgeMonths(ageMonths) {
  const m = clampInt(ageMonths, 0, 120)
  // From the spec:
  // 0–6 months: 15%, 6–12 months: 25%, 1–2 years: 35–40%, 2–3 years: 50%
  if (m <= 6) return 0.15
  if (m <= 12) return 0.25
  if (m <= 24) return 0.38
  if (m <= 36) return 0.5
  return 0.55
}

function demandFactorFor(brand, demandTier) {
  const tier = String(demandTier || '').toUpperCase().trim()
  if (tier === 'HIGH') return 1.03
  if (tier === 'MEDIUM') return 0.95
  if (tier === 'LOW') return 0.8

  const b = String(brand || '').toLowerCase()
  if (b.includes('apple') || b.includes('iphone')) return 1.03
  if (b.includes('samsung') || b.includes('oneplus') || b.includes('google')) return 0.98
  return 0.85
}

export async function estimateSellingPrice({
  brand,
  model,
  ram,
  storage,
  screenCondition,
  bodyCondition,
  batteryHealth,
  accessories,
  deviceAgeMonths,
  demandTier,
  repairBufferInr,
  profitMarginInr,
}) {
  if (!brand || !model || !ram || !storage) {
    return { finalPrice: 0, breakdown: {} }
  }

  const brandDoc = await Brand.findOne({
    $or: [
      { name: { $regex: `^${brand}$`, $options: 'i' } },
      { slug: { $regex: String(brand).toLowerCase(), $options: 'i' } },
    ],
    active: true,
  }).lean()

  if (!brandDoc) return { finalPrice: 0, breakdown: {} }

  const modelDoc = await PhoneModel.findOne({
    brandId: brandDoc._id,
    active: true,
    $or: [
      { modelName: { $regex: `^${model}$`, $options: 'i' } },
      { slug: { $regex: String(model).toLowerCase().replace(/\\s+/g, '-'), $options: 'i' } },
      { slug: { $regex: String(model).toLowerCase(), $options: 'i' } },
    ],
  }).lean()

  if (!modelDoc) return { finalPrice: 0, breakdown: {} }

  const variants = Array.isArray(modelDoc.storageVariants) ? modelDoc.storageVariants : []
  const selectedVariant = variants.find(
    (v) => String(v.ram).trim() === String(ram).trim() && String(v.label).trim() === String(storage).trim(),
  )

  // Step 1: Base market price (use selected storageVariant basePrice)
  const baseMarketPrice = selectedVariant?.basePrice ?? modelDoc.basePrice ?? 0

  // Step 5: Demand factor
  const demandFactor = demandFactorFor(brandDoc.name, demandTier)
  const demandAdjusted = Math.round(baseMarketPrice * demandFactor)

  // Step 2: Depreciation (percent of demand-adjusted)
  const ageMonths = deviceAgeMonths != null ? clampInt(deviceAgeMonths, 0, 120) : 18
  const depreciationPct = depreciationPctByAgeMonths(ageMonths)
  const depreciationInr = Math.round(demandAdjusted * depreciationPct)

  // Step 3: Condition loss (fixed INR deductions)
  const screenLossInr = CONDITION_LOSS_INR.screenCondition[screenCondition] ?? 0
  const bodyLossInr = CONDITION_LOSS_INR.bodyCondition[bodyCondition] ?? 0
  const batteryLossInr = CONDITION_LOSS_INR.batteryHealth[batteryHealth] ?? 0
  const accessoriesLossInr = 0 // Not part of the provided spec; keep 0 for now.
  const conditionLossInr = screenLossInr + bodyLossInr + batteryLossInr + accessoriesLossInr

  // Step 4: Repair buffer
  const bufferInr =
    repairBufferInr != null ? clampInt(repairBufferInr, 0, 100000) : DEFAULT_REPAIR_BUFFER_INR

  // Step 6: Profit margin (ensure a minimum profit per device)
  const marginInr =
    profitMarginInr != null ? clampInt(profitMarginInr, 0, 100000) : DEFAULT_PROFIT_MARGIN_INR

  const computed = demandAdjusted - depreciationInr - conditionLossInr - bufferInr - marginInr
  const final = Math.max(500, Math.round(computed))

  return {
    finalPrice: final,
    breakdown: {
      // keep legacy key used by UI
      basePrice: baseMarketPrice,
      variantDelta: 0,
      // v2 breakdown
      baseMarketPrice,
      demandFactor,
      demandAdjusted,
      deviceAgeMonths: ageMonths,
      depreciationPct,
      depreciationInr,
      conditionLossInr,
      repairBufferInr: bufferInr,
      profitMarginInr: marginInr,
      conditionLoss: {
        screenLossInr,
        bodyLossInr,
        batteryLossInr,
        accessoriesLossInr,
      },
    },
  }
}

