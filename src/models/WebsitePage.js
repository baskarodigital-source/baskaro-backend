import mongoose from 'mongoose'

/** CMS-managed static website pages (About, Terms, Contact, etc.). */
const websitePageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, default: '', trim: true, maxlength: 500 },
    body: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'website_pages' },
)

websitePageSchema.index({ isPublished: 1 })

export const WebsitePage = mongoose.model('WebsitePage', websitePageSchema)
