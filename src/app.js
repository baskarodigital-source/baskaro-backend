import express from 'express'
import cors from 'cors'

import catalogRouter from './routes/catalog.js'
import authRouter from './routes/auth.js'
import pricingRouter from './routes/pricing.js'
import ordersRouter from './routes/orders.js'
import addressesRouter from './routes/addresses.js'
import adminRouter from './routes/admin.js'

// New route imports
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

import { errorHandler } from './utils/errorHandler.js'

export const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  }),
)
app.use(express.json({ limit: '6mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
// Also expose under /api to match documented base URL.
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Existing routes
app.use('/api/catalog', catalogRouter)
app.use('/api/auth', authRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/addresses', addressesRouter)
app.use('/api/admin', adminRouter)

// New routes
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

// Error handling middleware (must be last)
app.use(errorHandler)

