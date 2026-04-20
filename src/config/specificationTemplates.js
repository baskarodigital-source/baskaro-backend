/**
 * Dynamic specification templates by ribbon category label (normalized).
 * Returned by /api/specifications/:categoryId
 *
 * Spec shape:
 * - key: string (used in payload under specifications[key])
 * - name: string (label for UI)
 * - type: 'text' | 'number' | 'dropdown' | 'boolean'
 * - required?: boolean
 * - options?: string[] (for dropdown)
 */

export const SPEC_TEMPLATES_BY_CATEGORY = {
  smartphones: [
    { key: 'display', name: 'Display', type: 'text', required: true },
    { key: 'processor', name: 'Processor', type: 'text', required: true },
    { key: 'camera', name: 'Camera', type: 'text' },
    { key: 'battery', name: 'Battery', type: 'text' },
    { key: 'os', name: 'Operating System', type: 'dropdown', required: true, options: ['Android', 'iOS', 'Other'] },
    { key: 'releaseYear', name: 'Release Year', type: 'number' },
    { key: 'has5g', name: '5G Support', type: 'boolean' },
  ],

  laptops: [
    { key: 'processor', name: 'Processor', type: 'text', required: true },
    { key: 'ram', name: 'RAM', type: 'dropdown', required: true, options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'] },
    { key: 'storage', name: 'Storage', type: 'dropdown', required: true, options: ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB'] },
    { key: 'display', name: 'Display', type: 'text' },
    { key: 'gpu', name: 'GPU', type: 'text' },
    { key: 'os', name: 'Operating System', type: 'dropdown', options: ['Windows', 'macOS', 'Linux', 'Other'] },
  ],

  accessories: [
    { key: 'type', name: 'Accessory Type', type: 'text', required: true },
    { key: 'compatibility', name: 'Compatibility', type: 'text' },
    { key: 'color', name: 'Color', type: 'text' },
  ],
}

export function normalizeCategoryLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '')
}

