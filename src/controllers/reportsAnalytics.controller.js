import { successResponse } from '../utils/helpers.js'
import * as reportsAnalyticsService from '../services/reportsAnalytics.service.js'

// Get sales report
export async function getSalesReport(req, res) {
  const { period = 'daily', startDate, endDate } = req.query
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
    })
  }
  
  const data = await reportsAnalyticsService.getSalesReport({ period, startDate, endDate })
  return successResponse(res, data, 'Sales report retrieved successfully')
}

// Get monthly revenue report
export async function getMonthlyRevenueReport(req, res) {
  const { year = new Date().getFullYear() } = req.query
  const data = await reportsAnalyticsService.getMonthlyRevenueReport(year)
  return successResponse(res, data, 'Monthly revenue report retrieved successfully')
}

// Get most sold devices
export async function getMostSoldDevices(req, res) {
  const { limit = 10 } = req.query
  const data = await reportsAnalyticsService.getMostSoldDevices(parseInt(limit))
  return successResponse(res, data, 'Most sold devices retrieved successfully')
}

// Get customer analytics
export async function getCustomerAnalytics(req, res) {
  const data = await reportsAnalyticsService.getCustomerAnalytics()
  return successResponse(res, data, 'Customer analytics retrieved successfully')
}

// Get payment analytics
export async function getPaymentAnalytics(req, res) {
  const { startDate, endDate } = req.query
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
    })
  }
  
  const data = await reportsAnalyticsService.getPaymentAnalytics(startDate, endDate)
  return successResponse(res, data, 'Payment analytics retrieved successfully')
}

// Export data as JSON
export async function exportDataJSON(req, res) {
  const { model, ...filters } = req.query
  
  if (!model) {
    return res.status(400).json({
      success: false,
      message: 'Model name is required',
    })
  }
  
  const data = await reportsAnalyticsService.exportDataJSON(model, filters)
  return successResponse(res, data, 'Data exported successfully')
}
