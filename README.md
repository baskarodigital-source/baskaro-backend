# Baskaro Backend - Production Ready Mobile Resale Platform

A comprehensive, scalable, and production-ready backend for a mobile resale platform (similar to Cashify) built with Node.js, Express, and MongoDB.

## 🎯 Features

### Core Modules
- ✅ **Authentication & Authorization** - JWT-based auth with role management (SUPER_ADMIN, MANAGER, SUPPORT, ADMIN, USER)
- ✅ **Dashboard & Analytics** - Real-time statistics, charts, and business insights
- ✅ **User Management** - Complete user CRUD operations with block/unblock functionality
- ✅ **Mobile Catalog** - Brand and phone model management with variants
- ✅ **Device Condition Pricing** - Automated price calculation based on device condition
- ✅ **Order Management** - End-to-end order workflow with status tracking
- ✅ **Pickup Management** - Schedule and track device pickups
- ✅ **Payment Processing** - Multiple payment methods with status tracking
- ✅ **Inventory Management** - Refurbished phone inventory tracking
- ✅ **Coupon System** - Discount coupons with flexible rules
- ✅ **Banner/CMS** - Content management for promotional banners
- ✅ **Reports & Analytics** - Comprehensive business reports and exports

## 🏗️ Architecture

### Clean Architecture Pattern
```
Controller Layer (HTTP) 
    ↓
Service Layer (Business Logic)
    ↓
Model Layer (Data Access)
```

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing
- **Validation**: Joi schema validation
- **Middleware**: CORS, JSON parser, custom auth middleware

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Steps

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env` file:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/baskaro
JWT_SECRET=your-super-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

4. **Start MongoDB**
```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Run the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will be available at: `http://localhost:4000`

## 📚 Documentation

### API Documentation
Complete API documentation is available in [`api.md`](../api.md) with:
- 100+ endpoints
- cURL examples
- Request/response formats
- Authentication requirements

### Quick Start Guide
See [`QUICK_START.md`](./QUICK_START.md) for quick reference.

### Implementation Summary
See [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) for detailed overview.

## 🔌 API Endpoints

### Base URL
```
http://localhost:4000/api
```

### Key Endpoints

#### Authentication
```
POST   /api/auth/otp/request          # Request OTP
POST   /api/auth/otp/verify           # Verify OTP
POST   /api/auth/email/register       # Register with email
POST   /api/auth/email/login          # Login
GET    /api/auth/me                   # Get current user
PATCH  /api/auth/me                   # Update profile
```

#### Dashboard (Admin)
```
GET    /api/dashboard/stats                    # Dashboard statistics
GET    /api/dashboard/daily-sales              # Daily sales chart
GET    /api/dashboard/monthly-revenue          # Monthly revenue chart
GET    /api/dashboard/top-selling-phones       # Top selling phones
GET    /api/dashboard/order-status-distribution # Order distribution
```

#### User Management (Admin)
```
GET    /api/users?page=1&limit=10     # Get all users
GET    /api/users/:userId             # Get user by ID
PATCH  /api/users/:userId/block       # Block user
PATCH  /api/users/:userId/unblock     # Unblock user
PATCH  /api/users/:userId/role        # Update role
DELETE /api/users/:userId             # Delete user
```

#### Mobile Management
```
GET    /api/mobile/brands                      # Get all brands
POST   /api/mobile/brands                      # Create brand (Admin)
GET    /api/mobile/models?brandId=xxx          # Get models by brand
POST   /api/mobile/models                      # Create model (Admin)
```

#### Order Management
```
POST   /api/order-management          # Create order
GET    /api/order-management          # Get orders
GET    /api/order-management/:id      # Get order by ID
PATCH  /api/order-management/:id/status # Update status (Admin)
POST   /api/order-management/:id/apply-coupon # Apply coupon
```

#### Device Condition Pricing
```
GET    /api/device-condition          # Get all conditions
POST   /api/device-condition/calculate # Calculate price
POST   /api/device-condition          # Create condition (Admin)
```

And many more... See [api.md](../api.md) for complete list.

## 🔐 Authentication

### Getting Token
```bash
# Login to get JWT token
curl -X POST http://localhost:4000/api/auth/email/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

### Using Token
Include token in Authorization header:
```bash
curl http://localhost:4000/api/endpoint \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🗄️ Database Models

### Main Collections
- **users** - User accounts with roles and status
- **orders** - Sell orders with status history
- **brands** - Phone brands (Apple, Samsung, etc.)
- **phonemodels** - Phone models with variants
- **deviceconditions** - Condition grading rules
- **pickups** - Pickup scheduling
- **payments** - Payment transactions
- **inventory** - Refurbished phone stock
- **coupons** - Discount coupons
- **banners** - Promotional banners

## 🛠️ Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # HTTP request handlers
│   ├── services/       # Business logic layer
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Route definitions
│   ├── middleware/     # Custom middleware
│   └── utils/          # Utility functions
├── .env               # Environment variables
├── server.js          # Entry point
└── package.json
```

### Coding Standards
- ES6+ syntax with modules
- Async/await for async operations
- Centralized error handling
- Consistent response format
- Input validation
- Role-based access control

## 🧪 Testing

### Health Check
```bash
curl http://localhost:4000/api/health
# Response: {"ok":true}
```

### Manual Testing
Use Postman, Insomnia, or cURL to test endpoints. See [api.md](../api.md) for examples.

## 🚀 Deployment

### Environment Variables for Production
```env
PORT=8080
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/baskaro
JWT_SECRET=super-secure-random-string-min-32-chars
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### Recommended Deployments
- **Heroku**: Easy Node.js deployment
- **AWS EC2**: Full control
- **DigitalOcean**: Simple VPS
- **Vercel/Netlify**: Serverless functions
- **MongoDB Atlas**: Managed MongoDB

## 📊 Monitoring & Logging

Add these for production:
- **Winston/Morgan**: Logging
- **PM2**: Process manager
- **New Relic/DataDog**: Application monitoring
- **Sentry**: Error tracking

## 🔒 Security Best Practices

✅ Implemented:
- JWT authentication
- Password hashing with bcrypt
- Input validation with Joi
- CORS configuration
- Role-based access control

🔄 Recommended additions:
- Rate limiting (express-rate-limit)
- Helmet.js for security headers
- Request sanitization
- API key for external access
- HTTPS enforcement

## 📈 Performance Optimization

🔄 Recommended:
- Redis caching for frequently accessed data
- Database indexing on query fields
- Response compression (compression middleware)
- CDN for static assets
- Load balancing for high traffic

## 🤝 Contributing

1. Follow the existing code structure
2. Use meaningful variable and function names
3. Add comments for complex logic
4. Test your changes thoroughly
5. Update documentation if needed

## 📝 License

This project is proprietary and confidential.

## 🆘 Support

For issues or questions:
1. Check [api.md](../api.md) for endpoint documentation
2. Review [QUICK_START.md](./QUICK_START.md) for setup help
3. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for feature overview

## ✨ Credits

Built with ❤️ using Node.js, Express, and MongoDB

---

**Status**: ✅ Production Ready

**Version**: 1.0.0

**Last Updated**: March 2026
