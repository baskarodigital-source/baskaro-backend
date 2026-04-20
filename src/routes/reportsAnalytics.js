import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as reportsAnalyticsController from '../controllers/reportsAnalytics.controller.js'

const router = Router()

// All routes require admin authentication
router.use(requireAuth, requireAdmin)

router.get('/sales', reportsAnalyticsController.getSalesReport)
router.get('/monthly-revenue', reportsAnalyticsController.getMonthlyRevenueReport)
router.get('/most-sold-devices', reportsAnalyticsController.getMostSoldDevices)
router.get('/customer-analytics', reportsAnalyticsController.getCustomerAnalytics)
router.get('/payment-analytics', reportsAnalyticsController.getPaymentAnalytics)
router.get('/export', reportsAnalyticsController.exportDataJSON)

export default router
