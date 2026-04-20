import express from 'express'
import cors from 'cors'

export const app = express()

// ✅ Parse origins from ENV
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

// ✅ Proper CORS config
app.use(cors({
  origin: function (origin, callback) {
    // allow requests without origin (Postman, mobile apps)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    } else {
      return callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true
}))

// ✅ Handle preflight properly
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}))

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

// Error handler
import { errorHandler } from './utils/errorHandler.js'
app.use(errorHandler)