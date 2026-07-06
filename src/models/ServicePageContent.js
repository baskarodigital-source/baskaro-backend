import mongoose from 'mongoose'

const whyUsItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
)

/** CMS-driven blocks for marketing pages (Repair Phone, Nearby Stores, etc.). */
const servicePageContentSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 64 },
    whyUsItems: { type: [whyUsItemSchema], default: [] },
    sectionHeadings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'service_page_contents' },
)

export const ServicePageContent = mongoose.model('ServicePageContent', servicePageContentSchema)
