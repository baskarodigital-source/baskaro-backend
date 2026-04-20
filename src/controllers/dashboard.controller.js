import { successResponse } from '../utils/helpers.js'
import * as dashboardService from '../services/dashboard.service.js'

// Get all dashboard statistics
export async function getDashboardStats(req, res) {
  const stats = await dashboardService.getDashboardStats()
  return successResponse(res, stats, 'Dashboard statistics retrieved successfully')
}

// Get daily sales chart data
export async function getDailySales(req, res) {
  const { days = 30 } = req.query
  const data = await dashboardService.getDailySales(parseInt(days))
  return successResponse(res, data, 'Daily sales data retrieved successfully')
}

// Get monthly revenue chart data
export async function getMonthlyRevenue(req, res) {
  const { months = 12 } = req.query
  const data = await dashboardService.getMonthlyRevenue(parseInt(months))
  return successResponse(res, data, 'Monthly revenue data retrieved successfully')
}

// Get top selling phones
export async function getTopSellingPhones(req, res) {
  const { limit = 10 } = req.query
  const data = await dashboardService.getTopSellingPhones(parseInt(limit))
  return successResponse(res, data, 'Top selling phones retrieved successfully')
}

// Get order status distribution
export async function getOrderStatusDistribution(req, res) {
  const data = await dashboardService.getOrderStatusDistribution()
  return successResponse(res, data, 'Order status distribution retrieved successfully')
}

// Get recent activities
export async function getRecentActivities(req, res) {
  const { limit = 10 } = req.query
  const data = await dashboardService.getRecentActivities(parseInt(limit))
  return successResponse(res, data, 'Recent activities retrieved successfully')
}
