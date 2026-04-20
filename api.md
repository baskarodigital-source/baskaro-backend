# Baskaro API — cURL examples

Default base URL: `http://localhost:4000` (override with `PORT` in `.env`).

Replace placeholders:

- `YOUR_JWT` — Bearer token from OTP verify, email register, or email login.
- MongoDB ObjectIds where shown (`...` hex strings).

Authenticated requests:

```bash
-H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json"
```

Admin routes accept roles: `admin`, `SUPER_ADMIN`, `MANAGER`, `SUPPORT`.

---

## Health

```bash
curl -s http://localhost:4000/health
```

```bash
curl -s http://localhost:4000/api/health
```

---

## Catalog (`/api/catalog`)

```bash
curl -s "http://localhost:4000/api/catalog/brands"
```

```bash
curl -s "http://localhost:4000/api/catalog/models?brandId=BRAND_OBJECT_ID"
```

```bash
curl -s "http://localhost:4000/api/catalog/variants?modelId=MODEL_OBJECT_ID"
```

```bash
curl -s "http://localhost:4000/api/catalog/structure"
```

---

## Auth (`/api/auth`)

```bash
curl -s -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9876543210\"}"
```

```bash
curl -s -X POST http://localhost:4000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9876543210\",\"otp\":\"123456\"}"
```

```bash
curl -s -X POST http://localhost:4000/api/auth/email/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"user@example.com\",\"phone\":\"9876543210\",\"password\":\"secret12\"}"
```

```bash
curl -s -X POST http://localhost:4000/api/auth/email/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"secret12\"}"
```

```bash
curl -s http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"New Name\",\"email\":\"new@example.com\",\"phone\":\"9876543210\"}"
```

---

## Pricing (`/api/pricing`)

```bash
curl -s -X POST http://localhost:4000/api/pricing/estimate \
  -H "Content-Type: application/json" \
  -d "{\"brand\":\"Apple\",\"model\":\"iPhone 13\",\"ram\":\"4GB\",\"storage\":\"128GB\",\"screenCondition\":\"good\",\"bodyCondition\":\"good\",\"batteryHealth\":\"85\",\"accessories\":\"charger\"}"
```

---

## Orders — user sell flow (`/api/orders`)

```bash
curl -s -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"brand\":\"Apple\",\"model\":\"iPhone 13\",\"ram\":\"4GB\",\"storage\":\"128GB\",\"screen\":\"good\",\"body\":\"good\",\"battery\":\"85\",\"accessories\":\"none\",\"pickupDate\":\"2026-04-10\",\"pickupTime\":\"10:00-12:00\",\"address\":{\"line1\":\"1 Main St\",\"city\":\"Mumbai\",\"pincode\":\"400001\"},\"payMethod\":\"UPI\"}"
```

```bash
curl -s http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/orders/ORDER_OBJECT_ID/payment" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"payMethod\":\"UPI\",\"paymentDetails\":{}}"
```

---

## Addresses (`/api/addresses`)

```bash
curl -s http://localhost:4000/api/addresses \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X POST http://localhost:4000/api/addresses \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"label\":\"Home\",\"line1\":\"1 Main St\",\"city\":\"Mumbai\",\"state\":\"MH\",\"pincode\":\"400001\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/addresses/ADDRESS_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Admin — legacy orders & catalog (`/api/admin`)

All routes: **Bearer JWT** + admin-class role.

```bash
curl -s "http://localhost:4000/api/admin/orders" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/admin/orders?status=PLACED" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/admin/orders/ORDER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"VERIFIED\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/admin/orders/ORDER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s http://localhost:4000/api/admin/catalog \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/admin/catalog/variants/VARIANT_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"priceDelta\":500}"
```

---

## Dashboard (`/api/dashboard`)

All routes: **Bearer JWT** + admin.

```bash
curl -s http://localhost:4000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/dashboard/daily-sales?days=30" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/dashboard/monthly-revenue?months=12" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/dashboard/top-selling-phones?limit=10" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s http://localhost:4000/api/dashboard/order-status-distribution \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/dashboard/recent-activities?limit=10" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## User management (`/api/users`)

All routes: **Bearer JWT** + admin.

```bash
curl -s "http://localhost:4000/api/users?page=1&limit=10&search=&status=" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/users/USER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/users/USER_OBJECT_ID/block" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/users/USER_OBJECT_ID/unblock" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/users/USER_OBJECT_ID/role" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"admin\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/users/USER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Mobile — brands & models (`/api/mobile`)

```bash
curl -s "http://localhost:4000/api/mobile/brands?page=1&limit=10&active=true"
```

```bash
curl -s "http://localhost:4000/api/mobile/brands/BRAND_OBJECT_ID"
```

```bash
curl -s -X POST http://localhost:4000/api/mobile/brands \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Apple\",\"slug\":\"apple\",\"sortOrder\":0,\"active\":true}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/mobile/brands/BRAND_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Apple Inc\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/mobile/brands/BRAND_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/mobile/models?brandId=BRAND_OBJECT_ID&page=1&limit=10&active=true"
```

```bash
curl -s "http://localhost:4000/api/mobile/models/MODEL_OBJECT_ID"
```

```bash
curl -s -X POST http://localhost:4000/api/mobile/models \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"brandId\":\"BRAND_OBJECT_ID\",\"modelName\":\"iPhone 13\",\"slug\":\"iphone-13\",\"storageVariants\":[{\"label\":\"128GB\",\"basePrice\":45000,\"ram\":\"4GB\"}],\"basePrice\":45000,\"active\":true}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/mobile/models/MODEL_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"basePrice\":44000}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/mobile/models/MODEL_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Device condition (`/api/device-condition`)

```bash
curl -s -X POST http://localhost:4000/api/device-condition/calculate \
  -H "Content-Type: application/json" \
  -d "{\"basePrice\":50000,\"conditionType\":\"GOOD\",\"deductions\":{\"screen\":5,\"battery\":2}}"
```

```bash
curl -s "http://localhost:4000/api/device-condition/EXCELLENT"
```

```bash
curl -s http://localhost:4000/api/device-condition/ \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X POST http://localhost:4000/api/device-condition/ \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"condition\":\"EXCELLENT\",\"description\":\"Like new\",\"deductions\":{\"screen\":0,\"battery\":0,\"camera\":0,\"faceId\":0},\"isActive\":true}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/device-condition/CONDITION_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Updated\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/device-condition/CONDITION_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Order management (`/api/order-management`)

All routes: **Bearer JWT** (non-admins are scoped to their own orders on list).

`status` values: `PLACED`, `PICKUP_SCHEDULED`, `VERIFIED`, `PRICE_FINALIZED`, `COMPLETED`, `CANCELLED`.

```bash
curl -s -X POST http://localhost:4000/api/order-management \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"brandId\":\"BRAND_OBJECT_ID\",\"modelId\":\"MODEL_OBJECT_ID\",\"brand\":\"Apple\",\"modelName\":\"iPhone 13\",\"storage\":\"128GB\",\"ram\":\"4GB\",\"condition\":\"EXCELLENT\",\"screenCondition\":\"perfect\",\"bodyCondition\":\"minor scratches\",\"batteryHealth\":\"95\",\"accessories\":\"box\",\"basePrice\":50000,\"calculatedPrice\":48000,\"finalPrice\":47500,\"deductions\":{\"screen\":0,\"battery\":0,\"camera\":0,\"faceId\":0},\"pickupDate\":\"2026-04-10\",\"pickupTime\":\"10:00-12:00\",\"address\":{\"line1\":\"1 Main St\",\"city\":\"Mumbai\",\"pincode\":\"400001\"},\"payMethod\":\"UPI\"}"
```

```bash
curl -s "http://localhost:4000/api/order-management?page=1&limit=10&status=&userId=&brandId=&startDate=&endDate=" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/order-management/ORDER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/order-management/ORDER_OBJECT_ID/status" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"VERIFIED\",\"notes\":\"Checked device\"}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/order-management/ORDER_OBJECT_ID/cancel" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"Customer request\"}"
```

```bash
curl -s -X POST "http://localhost:4000/api/order-management/ORDER_OBJECT_ID/apply-coupon" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"couponCode\":\"SAVE10\"}"
```

---

## Pickup (`/api/pickup`)

All routes: **Bearer JWT**. Schedule pickup, update status, and assign agent require **admin**; get by order ID is any authenticated user.

```bash
curl -s -X POST http://localhost:4000/api/pickup \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ORDER_OBJECT_ID\",\"address\":{\"line1\":\"1 Main St\",\"city\":\"Mumbai\",\"pincode\":\"400001\"},\"scheduledDate\":\"2026-04-10\",\"scheduledTime\":\"10:00-12:00\",\"status\":\"PENDING\"}"
```

```bash
curl -s "http://localhost:4000/api/pickup/order/ORDER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/pickup/PICKUP_OBJECT_ID/status" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"COMPLETED\",\"notes\":\"Done\"}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/pickup/PICKUP_OBJECT_ID/assign-agent" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"agentName\":\"Ravi\",\"agentPhone\":\"9876543210\"}"
```

---

## Payments (`/api/payments`)

**Bearer JWT** required. `GET /` (all payments) and `PATCH /:paymentId/status` require **admin**; `initiate` and `GET /order/:orderId` are any authenticated user.

```bash
curl -s "http://localhost:4000/api/payments?page=1&limit=10&status=" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X POST http://localhost:4000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ORDER_OBJECT_ID\",\"method\":\"UPI\"}"
```

```bash
curl -s "http://localhost:4000/api/payments/order/ORDER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/payments/PAYMENT_OBJECT_ID/status" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"PAID\",\"transactionId\":\"TXN123\"}"
```

---

## Inventory (`/api/inventory`)

List/get: **no auth**. Writes: **Bearer JWT** + **admin**.

```bash
curl -s "http://localhost:4000/api/inventory?page=1&limit=10&brandId=&modelId=&conditionGrade=&isSold="
```

```bash
curl -s "http://localhost:4000/api/inventory/INVENTORY_OBJECT_ID"
```

```bash
curl -s -X POST http://localhost:4000/api/inventory \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"modelId\":\"MODEL_OBJECT_ID\",\"conditionGrade\":\"EXCELLENT\",\"price\":35000,\"stock\":1,\"specifications\":{},\"images\":[]}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/inventory/INVENTORY_OBJECT_ID/stock" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"stock\":5}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/inventory/INVENTORY_OBJECT_ID/price" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"price\":34000}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/inventory/INVENTORY_OBJECT_ID/mark-sold" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Coupons (`/api/coupons`)

```bash
curl -s "http://localhost:4000/api/coupons/code/SAVE10"
```

Admin (**Bearer JWT** + admin):

```bash
curl -s "http://localhost:4000/api/coupons?page=1&limit=10&active=true" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/coupons/COUPON_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X POST http://localhost:4000/api/coupons \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"SAVE10\",\"description\":\"10% off\",\"discountPercent\":10,\"maxDiscountAmount\":500,\"minOrderAmount\":1000,\"expiryDate\":\"2026-12-31T23:59:59.000Z\",\"isActive\":true,\"usageLimit\":100,\"applicableFor\":\"ALL\"}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/coupons/COUPON_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Updated\"}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/coupons/COUPON_OBJECT_ID/disable" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/coupons/COUPON_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Banners (`/api/banners`)

List/get: **no auth**. Writes: **Bearer JWT** + **admin**.

```bash
curl -s "http://localhost:4000/api/banners?position=&active=true"
```

```bash
curl -s "http://localhost:4000/api/banners/BANNER_OBJECT_ID"
```

```bash
curl -s -X POST http://localhost:4000/api/banners \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Sale\",\"imageUrl\":\"https://example.com/banner.jpg\",\"redirectUrl\":\"/shop\",\"position\":\"HOME_TOP\",\"isActive\":true,\"displayOrder\":0}"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/banners/BANNER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Big Sale\"}"
```

```bash
curl -s -X DELETE "http://localhost:4000/api/banners/BANNER_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s -X PATCH "http://localhost:4000/api/banners/BANNER_OBJECT_ID/toggle-status" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"isActive\":false}"
```

---

## Reports (`/api/reports`)

All routes: **Bearer JWT** + **admin**.

```bash
curl -s "http://localhost:4000/api/reports/sales?period=daily&startDate=2026-01-01&endDate=2026-04-03" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/reports/monthly-revenue?year=2026" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/reports/most-sold-devices?limit=10" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s http://localhost:4000/api/reports/customer-analytics \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/reports/payment-analytics?startDate=2026-01-01&endDate=2026-04-03" \
  -H "Authorization: Bearer YOUR_JWT"
```

```bash
curl -s "http://localhost:4000/api/reports/export?model=Order" \
  -H "Authorization: Bearer YOUR_JWT"
```

`model` must be a registered Mongoose model name (e.g. `Order`, `User`, `Payment`). Remaining query keys are passed as `find` filters.
