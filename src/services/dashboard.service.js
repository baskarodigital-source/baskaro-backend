import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { Brand } from '../models/Brand.js'
import { PhoneModel } from '../models/PhoneModel.js'
import { Payment } from '../models/Payment.js'

// Get dashboard statistics
export async function getDashboardStats() {
  const totalUsers = await User.countDocuments({ status: 'ACTIVE' })
  const totalOrders = await Order.countDocuments()
  
  const pendingOrders = await Order.countDocuments({ 
    status: { $in: ['PLACED', 'PICKUP_SCHEDULED'] }
  })
  
  const completedOrders = await Order.countDocuments({ 
    status: 'COMPLETED'
  })
  
  // Calculate total revenue from completed orders
  const revenueData = await Order.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$finalPrice' } } }
  ])
  
  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0
  
  // Count total devices listed (from inventory + orders)
  const totalDevicesListed = await Order.countDocuments()
  
  return {
    totalUsers,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    totalDevicesListed,
  }
}

// Get daily sales data for charts (last 30 days)
export async function getDailySales(days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          }
        },
        sales: { $sum: '$finalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ])
  
  return salesData.map(item => ({
    date: item._id.date,
    sales: item.sales,
    orders: item.orders
  }))
}

// Get monthly revenue data for charts (last 12 months)
export async function getMonthlyRevenue(months = 12) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  
  const revenueData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
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
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ])
  
  return revenueData.map(item => ({
    month: item._id.month,
    revenue: item.revenue,
    orders: item.orders
  }))
}

// Get top selling phones
export async function getTopSellingPhones(limit = 10) {
  const topPhones = await Order.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: {
          brandId: '$brandId',
          modelId: '$modelId',
          brand: '$brand',
          modelName: '$modelName'
        }
      }
    },
    { $count: 'salesCount' },
    { $sort: { salesCount: -1 } },
    { $limit: limit }
  ])
  
  return topPhones.map((item, index) => ({
    rank: index + 1,
    brandId: item._id?.brandId,
    modelId: item._id?.modelId,
    brand: item._id?.brand || 'Unknown',
    modelName: item._id?.modelName || 'Unknown',
    salesCount: item.salesCount
  }))
}

// Get order status distribution
export async function getOrderStatusDistribution() {
  const distribution = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ])
  
  return distribution.map(item => ({
    status: item._id,
    count: item.count
  }))
}

// Get recent activities
export async function getRecentActivities(limit = 10) {
  const recentOrders = await Order.find()
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('userId brand modelName status finalPrice createdAt')
  
  return recentOrders.map(order => ({
    type: 'order',
    user: order.userId,
    details: `${order.brand} ${order.modelName}`,
    status: order.status,
    amount: order.finalPrice,
    createdAt: order.createdAt
  }))
}
