# naijabasket Deployment Quick Start
# ================================

## 🚀 DEPLOYMENT READY - Quick Launch Guide

### Prerequisites Checklist
- [x] Node.js 18+ installed
- [x] npm installed
- [x] All source files created (9 dashboard components)
- [x] All dependencies in package.json
- [x] backend/.env configured
- [ ] PostgreSQL running (for full-featured deployment)
- [ ] Database migration executed (optional for testing)

---

## 🎯 OPTION 1: Test Locally (Recommended First)

### 1A. Install Dependencies (One-time)

**Frontend:**
```
npm install
```

**Backend:**
```
cd backend
npm install
cd ..
```

### 1B. Start Frontend

```
npm run dev
```

✅ Opens: http://localhost:5173

### 1C. Start Backend (Optional)

```
cd backend
npm run dev
```

✅ Runs on: http://localhost:3000

---

## 🐳 OPTION 2: Docker Deployment (Containerized)

### 2A. Build Docker Images

```
cd backend
docker-compose up --build
```

This starts:
- ✅ PostgreSQL database
- ✅ Node.js backend on port 3000
- ✅ All services in containers

### 2B. Start Frontend

```
npm run dev
```

✅ Frontend on: http://localhost:5173

---

## 📦 OPTION 3: Production Build

### 3A. Build Frontend

```
npm run build
```

Creates: `dist/` folder (ready for nginx/Apache/CDN)

### 3B. Build Backend

```
cd backend
npm run build
npm start
```

Runs compiled backend on port 3000

---

## 📊 Verify Deployment

### Check Frontend
```
curl http://localhost:5173
```

### Check Backend API
```
curl http://localhost:3000/api/admin/accounting/products
```

### Check Socket.io
```
curl http://localhost:3000/socket.io/?EIO=4&transport=polling
```

---

## 🗄️ Database Setup (If Using PostgreSQL)

### Create Database
```
createdb naijabasket
```

### Run Migration
```
psql naijabasket < backend/src/migrations/005_create_accounting_schema.sql
```

### Verify Tables
```
psql naijabasket -c "\dt"
```

Expected output:
```
 customers      - Customer data
 products       - Product catalog
 sales          - Transactions
 inventory_log  - Audit trail
 expenses       - Business costs
```

---

## 🌐 Cloud Deployment Options

### A. Heroku (Full Stack)
```
# Backend
cd backend
heroku create naijabasket-api
git push heroku main

# Frontend
npm run build
# Deploy dist/ to Vercel or Netlify
```

### B. AWS (Full Stack)
- Backend: EC2 (Node.js) or ECS (Docker)
- Database: RDS (PostgreSQL)
- Frontend: S3 + CloudFront

### C. DigitalOcean (Full Stack)
- App Platform: Docker deployment
  ```
  doctl apps create --spec app.yaml
  ```
- Or: Droplet (VPS) + manual setup

### D. Vercel (Frontend Only)
```
npm run build
vercel --prod
```

Backend deployed separately on infrastructure above.

---

## 📝 Environment Variables for Production

### Backend (.env)

```
DATABASE_URL=postgresql://user:password@host:5432/naijabasket
NODE_ENV=production
PORT=3000
API_URL=https://api.naijabasket.com

JWT_SECRET=<generate-random-32-char-string>
REFRESH_TOKEN_SECRET=<generate-random-32-char-string>

PAYSTACK_SECRET_KEY=<your-paystack-key>
PAYSTACK_PUBLIC_KEY=<your-paystack-key>

ALLOWED_ORIGINS=https://naijabasket.com,https://www.naijabasket.com
SOCKET_IO_CORS_ORIGIN=https://naijabasket.com

LOG_LEVEL=warn
```

### Frontend (Vite env)

Create `.env.production`:
```
VITE_API_URL=https://api.naijabasket.com
VITE_SOCKET_IO_URL=https://api.naijabasket.com
```

---

## ✅ Deployment Checklist

- [ ] npm install (frontend)
- [ ] npm install (backend)
- [ ] backend/.env created with correct DATABASE_URL
- [ ] PostgreSQL database created (if using DB)
- [ ] Migration executed (5 tables created)
- [ ] npm run dev (frontend) ✅ Working
- [ ] npm run dev (backend) ✅ Working
- [ ] Dashboard loads at http://localhost:5173
- [ ] API responds at http://localhost:3000/api/...
- [ ] Socket.io connects (🟢 Live badge shows)
- [ ] Can view Dashboard → Accounting page
- [ ] KPI cards display
- [ ] Can create test sale and see real-time update
- [ ] Can download PDF report
- [ ] No console errors (F12 → Console)

---

## 📞 Troubleshooting

### Port Already in Use
```
# Kill process on port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Error
```
# Test connection
psql -U postgres -h localhost -d naijabasket -c "SELECT 1;"

# Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

### Socket.io Not Connecting
```
# Check backend logs for socket.io startup
# Should see: "Socket.io listening..."

# Check browser console (F12) for errors
# Should see socket.io event listeners attached
```

### Missing Dependencies
```
npm install --save-exact
cd backend && npm install --save-exact
```

---

## 🎉 Next Steps After Deployment

1. **Test the Dashboard**
   - Create sample sales
   - Export PDF reports
   - Check real-time KPI updates

2. **Configure Email (Optional)**
   - Set SMTP credentials in .env
   - Enable order notifications

3. **Setup Payments (Optional)**
   - Add Paystack API keys
   - Configure crypto wallet

4. **Monitoring**
   - Setup logging (logs/ folder)
   - Monitor database performance
   - Track Socket.io connections

5. **Scale to Production**
   - Use Docker for deployment
   - Setup CDN for frontend assets
   - Configure database backups

---

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - 5-minute setup
- [ACCOUNTING_DASHBOARD_README.md](ACCOUNTING_DASHBOARD_README.md) - Feature docs
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Verification

---

**🚀 Ready to deploy!**
