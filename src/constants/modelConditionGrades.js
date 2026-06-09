/** Pre-owned listing conditions shown on product pages (admin picks per model). */
export const MODEL_CONDITION_GRADES = ['Superb', 'Good', 'Fair']

export const DEFAULT_MODEL_CONDITION_GRADES = [...MODEL_CONDITION_GRADES]

export function normalizeModelConditionGrades(raw) {
  const allowed = new Set(MODEL_CONDITION_GRADES)
  const list = (Array.isArray(raw) ? raw : [])
    .map((x) => String(x || '').trim())
    .filter((x) => allowed.has(x))
  const unique = [...new Set(list)]
  unique.sort((a, b) => MODEL_CONDITION_GRADES.indexOf(a) - MODEL_CONDITION_GRADES.indexOf(b))
  return unique
}
