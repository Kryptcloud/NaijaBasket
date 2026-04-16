# naijabasket Backend API

A secure, production-ready Node.js/Express backend for the naijabasket e-commerce platform with Paystack payment integration, JWT authentication, and comprehensive security measures.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication with access & refresh tokens
- Role-based access control (RBAC) - customer/admin
- Bcrypt password hashing with 12 rounds
- Token refresh mechanism with database tracking

✅ **Security**
- Helmet.js for HTTP headers security
- CORS with whitelist enforcement
- Rate limiting (5 attempts/15min for login)
- Input validation & sanitization (XSS prevention)
- SQL injection prevention via parameterized queries
- HMAC-SHA512 webhook signature verification
- Comprehensive error handling without information leakage

✅ **Payment Processing**
- Paystack integration with webhook support
- Crypto payment support (BTC, USDT, BNB, XRP)
- Transaction tracking and verification
- Order lifecycle management

✅ **Data Management**
- PostgreSQL with connection pooling
- Transaction support (ACID compliance)
- Audit logging for compliance
- Soft deletes for data retention
- UUID primary keys

✅ **Admin Features**
- Product management (CRUD)
- Order management & status tracking
- Dashboard analytics
- Admin-only endpoint protection

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- npm or yarn
- Paystack account (for payments)

## Installation

### 1. Clone & Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# CRITICAL: Change all secrets!
nano .env
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/naijabasket
JWT_SECRET=your-super-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=another-secret-min-32-chars
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=webhook-secret
```

### 3. Database Setup
```bash
# Create database
createdb naijabasket

# Run migrations
psql naijabasket < src/migrations/001_init.sql

# Or use the migration runner (to be implemented)
npm run migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (revoke refresh token)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details

### Orders (Protected)
- `POST /api/orders` - Create order
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details

### Payments (Protected)
- `POST /api/payments/paystack/initialize` - Initialize Paystack payment
- `POST /api/payments/crypto/initiate` - Initiate crypto payment
- `GET /api/payments/:orderId/status` - Check payment status
- `POST /api/payments/paystack/webhook` - Paystack webhook (public)

### Admin (Protected + Admin Role Required)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/stats` - Get dashboard statistics

## Authentication

Include JWT token in requests:
```
Authorization: Bearer <access_token>
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "+2348012345678"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "items": [
      {
        "productId": "uuid-here",
        "quantity": 2
      }
    ],
    "deliveryAddress": "123 Main Street, Aba",
    "paymentMethod": "naira"
  }'
```

## Database Schema

### Tables
- `users` - User accounts with roles
- `products` - Available egg products
- `orders` - Customer orders
- `order_items` - Items in each order
- `transactions` - Payment transactions
- `refresh_tokens` - Active refresh tokens
- `audit_logs` - Admin action logs
- `login_attempts` - Failed login tracking

## Security Considerations

See `SECURITY.md` for detailed security documentation including:
- Authentication & authorization
- Input validation & sanitization
- Data protection
- API security
- Network security
- Monitoring & logging
- Compliance & best practices

## Development

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── middleware/        # Security, logging, error handling
│   ├── routes/           # API endpoints
│   ├── config/           # Database configuration
│   ├── migrations/       # Database schema
│   └── server.ts         # Application entry point
├── dist/                 # Compiled JavaScript
├── logs/                 # Application logs
├── package.json
├── tsconfig.json
├── SECURITY.md           # Security documentation
└── .env.example          # Environment variables template
```

## Logging

Logs are written to:
- **Console**: Development environment
- **File**: `logs/app.log` (all logs)
- **File**: `logs/errors.log` (errors only)

## Performance

- Database connection pooling (max 20 connections)
- Query result caching (via database indexes)
- HTTP compression enabled
- Request size limits to prevent DoS

## Monitoring

- Request logging with duration tracking
- Error logging with stack traces (dev only)
- Audit logging for admin actions
- Failed login attempt tracking
- Webhook verification logging

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `psql -l`

### JWT Token Errors
- Verify JWT_SECRET is set
- Check token hasn't expired
- Ensure token format: `Bearer <token>`

### Paystack Webhook Issues
- Verify PAYSTACK_WEBHOOK_SECRET
- Check Paystack dashboard for webhook deliveries
- Ensure webhook URL is publicly accessible

## Deployment

### Heroku
```bash
# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

### Docker
```bash
docker build -t naijabasket-backend .
docker run -p 3000:3000 --env-file .env naijabasket-backend
```

### Environment Variables (Production)
```env
NODE_ENV=production
JWT_SECRET=<strong-random-string>
REFRESH_TOKEN_SECRET=<strong-random-string>
DATABASE_URL=postgresql://...ssl=require
```

## License

ISC

## Support

For security issues, please email: security@naijabasket.com

For general support: support@naijabasket.com
