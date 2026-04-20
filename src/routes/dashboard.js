import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as dashboardController from '../controllers/dashboard.controller.js'

const router = Router()

// All dashboard routes require admin authentication
router.use(requireAuth, requireAdmin)

router.get('/stats', dashboardController.getDashboardStats)
router.get('/daily-sales', dashboardController.getDailySales)
router.get('/monthly-revenue', dashboardController.getMonthlyRevenue)
router.get('/top-selling-phones', dashboardController.getTopSellingPhones)
router.get('/order-status-distribution', dashboardController.getOrderStatusDistribution)
router.get('/recent-activities', dashboardController.getRecentActivities)

export default router
