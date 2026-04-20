import mongoose from 'mongoose'
import { Order } from '../models/Order.js'
import { Brand } from '../models/Brand.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { User } from '../models/User.js'
import { Payment } from '../models/Payment.js'

// Sales report (daily, weekly, monthly)
export async function getSalesReport({ period = 'daily', startDate, endDate }) {
  let dateFormat = '%Y-%m-%d' // daily
  if (period === 'weekly') dateFormat = '%Y-W%V'
  if (period === 'monthly') dateFormat = '%Y-%m'
  
  const matchQuery = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'COMPLETED'
  }
  
  const report = await Order.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          period: {
            $dateToString: { format: dateFormat, date: '$createdAt' }
          }
        },
        totalSales: { $sum: '$finalPrice' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$finalPrice' }
      }
    },
    { $sort: { '_id.period': 1 } }
  ])
  
  return report.map(item => ({
    period: item._id.period,
    totalSales: item.totalSales,
    totalOrders: item.totalOrders,
    averageOrderValue: item.averageOrderValue || 0
  }))
}

// Monthly revenue report
export async function getMonthlyRevenueReport(year = new Date().getFullYear()) {
  const startDate = new Date(`${year}-01-01`)
  const endDate = new Date(`${year}-12-31`)
  
  const report = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: {
          month: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          }
        },
        revenue: { $sum: '$finalPrice' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$finalPrice' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ])
  
  return report.map(item => ({
    month: item._id.month,
    revenue: item.revenue,
    orders: item.orders,
    averageOrderValue: item.averageOrderValue || 0
  }))
}

// Most sold brand/model
export async function getMostSoldDevices(limit = 10) {
  const topBrands = await Order.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: '$brandId',
        brandName: { $first: '$brand' },
        count: { $sum: 1 },
        totalRevenue: { $sum: '$finalPrice' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ])
  
  const topModels = await Order.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: {
          brandId: '$brandId',
          modelId: '$modelId',
          brand: '$brand',
          modelName: '$modelName'
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: '$finalPrice' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ])
  
  return {
    topBrands: topBrands.map((item, index) => ({
      rank: index + 1,
      brandId: item._id,
      brandName: item.brandName,
      count: item.count,
      totalRevenue: item.totalRevenue
    })),
    topModels: topModels.map((item, index) => ({
      rank: index + 1,
      brandId: item._id.brandId,
      modelId: item._id.modelId,
      brand: item._id.brand,
      modelName: item._id.modelName,
      count: item.count,
      totalRevenue: item.totalRevenue
    }))
  }
}

// Customer analytics
export async function getCustomerAnalytics() {
  const totalCustomers = await User.countDocuments({ status: 'ACTIVE' })
  
  const newCustomersThisMonth = await User.countDocuments({
    status: 'ACTIVE',
    createdAt: {
      $gte: new Date(new Date().setDate(1)) // First day of current month
    }
  })
  
  const customerOrderDistribution = await Order.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: '$userId'
      }
    },
    {
      $group: {
        _id: null,
        avgOrdersPerCustomer: { $avg: { $sum: 1 } },
        totalCustomers: { $sum: 1 }
      }
    }
  ])
  
  return {
    totalCustomers,
    newCustomersThisMonth,
    avgOrdersPerCustomer: customerOrderDistribution[0]?.avgOrdersPerCustomer || 0
  }
}

// Payment analytics
export async function getPaymentAnalytics(startDate, endDate) {
  const matchQuery = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }
  
  const paymentStats = await Payment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$method',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        }
      }
    }
  ])
  
  return paymentStats.map(item => ({
    method: item._id,
    totalAmount: item.totalAmount,
    count: item.count,
    successRate: item.count > 0 ? (item.successful / item.count) * 100 : 0,
    successful: item.successful,
    failed: item.failed
  }))
}

// Export data as JSON
export async function exportDataJSON(modelName, filters = {}) {
  const Model = mongoose.model(modelName)
  const data = await Model.find(filters).lean()
  return data
}
