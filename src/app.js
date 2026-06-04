import express from 'express'
import cors from 'cors'

export const app = express()

// CORS
// - Render/Vercel deployments often fail if `CORS_ORIGIN` isn't set.
// - We keep a safe default allowlist for local dev + your known production frontend.
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const corsAllowAll =
  process.env.CORS_ALLOW_ALL === 'true' ||
  envOrigins.includes('*') ||
  process.env.CORS_ORIGIN === '*'

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://baskaro-frontend.vercel.app',
  'https://baskaro.com',
  'https://www.baskaro.com'
]

const allowedOrigins = new Set([
  ...defaultOrigins,
  ...envOrigins.filter((o) => o !== '*'),
])

/** Any *.baskaro.com over HTTPS (apex, www, subdomains) */
const BASKARO_SITE_ORIGIN = /^https:\/\/([\w-]+\.)*baskaro\.com$/

/** Vite / dev server on LAN IP (phone on Wi‑Fi, --host) — same machine as API on 127.0.0.1 */
const LAN_DEV_ORIGIN =
  /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:(3000|5173|4173))?$/

const isAllowedOrigin = (origin) => {
  if (!origin) return true // curl/Postman/mobile apps
  if (corsAllowAll) return true
  if (allowedOrigins.has(origin)) return true
  if (BASKARO_SITE_ORIGIN.test(origin)) return true
  if (/^https:\/\/baskaro-frontend[-\w]*\.vercel\.app$/.test(origin)) return true
  if (LAN_DEV_ORIGIN.test(origin)) return true
  return false
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (isAllowedOrigin(origin)) return callback(null, origin)
    console.warn(`[CORS] Blocked origin: ${origin}`)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Legacy base64 video JSON only — skip multipart /video/file (multer handles that route)
app.use('/api/uploads/video', (req, res, next) => {
  const subPath = String(req.path || req.url || '').split('?')[0]
  if (subPath === '/file' || subPath.endsWith('/file')) return next()
  return express.json({ limit: '70mb' })(req, res, next)
})
app.use(express.json({ limit: '6mb' }))

// Health routes
app.get('/health', (_req, res) => res.json({ ok: true }))
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Routes
import catalogRouter from './routes/catalog.js'
import authRouter from './routes/auth.js'
import pricingRouter from './routes/pricing.js'
import ordersRouter from './routes/orders.js'
import addressesRouter from './routes/addresses.js'
import adminRouter from './routes/admin.js'

import dashboardRouter from './routes/dashboard.js'
import userManagementRouter from './routes/userManagement.js'
import mobileManagementRouter from './routes/mobileManagement.js'
import deviceConditionRouter from './routes/deviceCondition.js'
import orderManagementRouter from './routes/orderManagement.js'
import pickupManagementRouter from './routes/pickupManagement.js'
import paymentManagementRouter from './routes/paymentManagement.js'
import inventoryManagementRouter from './routes/inventoryManagement.js'
import couponManagementRouter from './routes/couponManagement.js'
import bannerManagementRouter from './routes/bannerManagement.js'
import reportsAnalyticsRouter from './routes/reportsAnalytics.js'
import ribbonCategoryRouter from './routes/ribbonCategory.js'
import deviceSpecificationsRouter from './routes/deviceSpecifications.js'
import flashDealRouter from './routes/flashDeal.js'
import homeServicesRouter from './routes/homeServices.js'
import offersRouter from './routes/offers.js'
import servicePageContentRouter from './routes/servicePageContent.js'
import preOwnedFeaturedRouter from './routes/preOwnedFeatured.js'
import uploadsRouter from './routes/uploads.js'

app.use('/api/catalog', catalogRouter)
app.use('/api/auth', authRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/addresses', addressesRouter)
app.use('/api/admin', adminRouter)

app.use('/api/dashboard', dashboardRouter)
app.use('/api/users', userManagementRouter)
app.use('/api/mobile', mobileManagementRouter)
app.use('/api/device-condition', deviceConditionRouter)
app.use('/api/order-management', orderManagementRouter)
app.use('/api/pickup', pickupManagementRouter)
app.use('/api/payments', paymentManagementRouter)
app.use('/api/inventory', inventoryManagementRouter)
app.use('/api/coupons', couponManagementRouter)
app.use('/api/banners', bannerManagementRouter)
app.use('/api/reports', reportsAnalyticsRouter)
app.use('/api/ribbon-categories', ribbonCategoryRouter)
app.use('/api/device-specifications', deviceSpecificationsRouter)
app.use('/api/flash-deals', flashDealRouter)
app.use('/api/home-services', homeServicesRouter)
app.use('/api/offers', offersRouter)
app.use('/api/service-page', servicePageContentRouter)
app.use('/api/pre-owned', preOwnedFeaturedRouter)
app.use('/api/uploads', uploadsRouter)

// Error handler
import { errorHandler } from './utils/errorHandler.js'
app.use(errorHandler)