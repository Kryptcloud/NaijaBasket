# ⚡ Quick Start Guide - Accounting Dashboard

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Step 1: Install Frontend Dependencies (30 sec)
```bash
# From root directory
npm install socket.io-client recharts jspdf html2canvas react-to-print
```

### Step 2: Install Backend Dependencies (30 sec)
```bash
cd backend
npm install socket.io
cd ..
```

### Step 3: Setup PostgreSQL (2 min)

**Windows:**
```powershell
# Start PostgreSQL service
# Then create database:
psql -U postgres -c "CREATE DATABASE naijabasket;"

# Run migration
psql -U postgres -d naijabasket -f backend/src/migrations/005_create_accounting_schema.sql
```

**Mac/Linux:**
```bash
createdb naijabasket
psql naijabasket < backend/src/migrations/005_create_accounting_schema.sql
```

### Step 4: Create `.env` file
Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/naijabasket
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
SOCKET_IO_ENABLED=true
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
```

**⚠️ Update:**
- `password` = your PostgreSQL password
- `user` = your PostgreSQL username

### Step 5: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Expect: "Server running on port 3000"
```

**Terminal 2 - Frontend:**
```bash
# From root
npm run dev
# Expect: "Local: http://localhost:5173"
```

### Step 6: Access Dashboard
1. Open browser: `http://localhost:5173`
2. Login with: **admin** / **admin123** (from App.tsx)
3. Click "📊 Accounting" button in navigation
4. **Dashboard loads!** 🎉

---

## 🧪 Testing Real-Time (Socket.io)

### Before testing:
Dashboard shows empty state until sales exist. Create test data:

### Option A: Insert via SQL
```sql
-- Login to PostgreSQL:
psql naijabasket

-- Insert test customer:
INSERT INTO customers (name, phone, email, address, customer_type)
VALUES ('John Doe', '08012345678', 'john@example.com', '123 Main St', 'retail');

-- Insert test product:
INSERT INTO products (name, unit_price, cost_per_unit, unit, quantity_in_stock)
VALUES ('Large Eggs', 4200, 1470, 'crate', 50);

-- Insert test sale:
INSERT INTO sales (customer_id, product_id, quantity, unit_price, payment_method, payment_status, sale_date)
VALUES (1, 1, 2, 4200, 'cash', 'paid', NOW());
```

### Option B: Use API (with curl/Postman)
```bash
# Create sale via API:
curl -X POST http://localhost:3000/api/admin/accounting/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "product_id": 1,
    "quantity": 2,
    "unit_price": 4200,
    "payment_method": "cash",
    "payment_status": "paid"
  }'
```

### Option C: Via Existing App
1. Add product to cart (if still available in shop)
2. Complete checkout with payment
3. Sale automatically recorded in accounting DB
4. Dashboard auto-refreshes via Socket.io

---

## 🔍 Troubleshooting

### Backend won't start
```
Error: ECONNREFUSED - server won't connect
Solution: 
- Check PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Verify database exists: psql -l
```

### Dashboard shows "Offline"
```
Socket.io not connecting
Solution:
- Check backend is running on port 3000
- Check browser console for errors: F12 → Console
- Verify SOCKET_IO_CORS_ORIGIN in .env
```

### API returns 404
```
Endpoints not found
Solution:
- Check backend routes are imported in server.ts
- Verify API_BASE in useAccountingAPI.ts = http://localhost:3000
- Restart backend after code changes
```

### Chart not rendering
```
No chart data showing
Solution:
- Normal if no sales in database
- Create test sale (see Testing section)
- Reload dashboard: F5
```

---

## 📊 Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ naijabasket Accounting Dashboard      🟢 Live      │
├─────────────────────────────────────────────────┤
│  💰 Revenue  |  📊 Transactions  |  📦 Units   │
│  ⏳ Pending  |  💵 Avg Order     |            │
├─────────────────────────────────────────────────┤
│  30-Day Revenue Trend Chart (Recharts)          │
├─────────────────────────────────────────────────┤
│  Filters: [Date From] [Date To] [Product] ...   │
│  [Apply] [Clear] [Download Report PDF]          │
├──────────────────────┬──────────────────────────┤
│                      │ Customer Panel:          │
│  Sales Table         │ [Search customers]      │
│  Date | Customer ... │ ➕ New Customer        │
│  ...pagination...    │                          │
│  [Prev] [Next]       │ Inventory Panel:        │
│                      │ ⚠️ Low Stock Alert      │
│                      │ [Product 1: 5/20]      │
│                      │ 🔄 Restock             │
│                      │                         │
└──────────────────────┴──────────────────────────┘
```

---

## 🎮 Feature Demo

### Create a Test Sale:
```sql
-- Insert all at once:
BEGIN;

INSERT INTO customers (name, phone, email, address, customer_type)
VALUES ('Demo Customer', '08000000000', 'demo@example.com', '100 Demo St', 'retail')
RETURNING id;
-- Copy the returned ID (e.g., 5)

INSERT INTO products (name, unit_price, cost_per_unit, unit, quantity_in_stock)
VALUES ('Demo Product', 5000, 1750, 'crate', 100)
RETURNING id;
-- Copy the returned ID (e.g., 3)

INSERT INTO sales (customer_id, product_id, quantity, unit_price, payment_method, payment_status)
VALUES (5, 3, 3, 5000, 'transfer', 'pending');

COMMIT;
```

### Watch Dashboard Update:
1. Refresh dashboard page
2. KPI cards show new data
3. Click on sale row to view invoice
4. Download PDF report
5. Test filters by date/product/status

---

## 🐛 Debug Mode

### Enable verbose logging:
Edit `backend/src/server.ts`:
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Check Socket.io in browser:
```javascript
// Type in browser console (F12):
socket // Should show connected socket object
typeof io // Should be "function"
```

### Monitor API calls:
Browser DevTools → Network tab → filter "XHR"

---

## 📦 Key Files to Know

| File | Purpose | Edit for... |
|------|---------|------------|
| `backend/src/routes/accounting.ts` | All API logic | Add endpoints |
| `src/hooks/useAccountingAPI.ts` | Frontend API client | Change API base URL |
| `src/components/dashboard/AccountingDashboard.tsx` | Main dashboard | Adjust layout |
| `src/components/dashboard/FilterBar.tsx` | Filters | Add/remove filters |
| `backend/src/migrations/005_create_accounting_schema.sql` | Database schema | Adjust tables |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm install` completed without errors
- [ ] PostgreSQL database created
- [ ] Migration ran successfully (5 tables exist)
- [ ] Backend started: `npm run dev`
- [ ] Frontend started: `npm run dev`
- [ ] Browser loaded: http://localhost:5173
- [ ] Logged in as admin
- [ ] "📊 Accounting" button visible
- [ ] Dashboard loaded (even if empty)
- [ ] Socket.io shows "🟢 Live"
- [ ] Can create test sale
- [ ] KPI cards update
- [ ] Can download PDF report
- [ ] Can view invoice

✅ **All checked? You're ready to use the dashboard!**

---

## 🆘 Need Help?

### Check logs:
```bash
# Backend logs
cat backend/logs/*.log

# Database logs
psql naijabasket -c "SELECT * FROM inventory_log ORDER BY logged_at DESC LIMIT 10;"

# Browser console errors
F12 → Console tab
```

### Common fixes:
1. **Clear browser cache:** Ctrl+Shift+Del → Clear all
2. **Restart backend:** Kill terminal, `npm run dev`
3. **Restart frontend:** Kill terminal, `npm run dev`
4. **Reset database:** Drop & recreate, re-run migration

---

## 📝 Next Steps

After verifying everything works:

1. **Create more test data** - Make realistic sales
2. **Test PDF export** - Verify invoice/report quality
3. **Check real-time updates** - Create sale, watch KPIs update
4. **Integrate with existing app** - Link accounting to shop flow
5. **Deploy** - Move to production environment

---

**Happy analyzing! 📊**
