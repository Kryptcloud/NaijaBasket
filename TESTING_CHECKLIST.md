# ✅ Dashboard Verification & Testing Checklist

## Pre-Setup Verification

### System Requirements
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm 9+ installed: `npm --version`
- [ ] PostgreSQL 12+ running
- [ ] Port 3000 available (backend)
- [ ] Port 5173 available (frontend)

### Project State
- [ ] App.tsx imports AccountingDashboard
- [ ] Nav button "📊 Accounting" exists
- [ ] All 9 dashboard components exist in `src/components/dashboard/`
- [ ] Both hooks exist in `src/hooks/`
- [ ] Migration file exists: `backend/src/migrations/005_create_accounting_schema.sql`

---

## Installation Verification

### Dependencies Installed

**Frontend (root):**
```bash
# Run this and verify no errors:
npm list socket.io-client recharts jspdf html2canvas react-to-print
```

Expected output:
```
├── html2canvas@1.4.1
├── jspdf@2.5.1
├── react-to-print@2.14.13
├── recharts@2.10.0
└── socket.io-client@4.7.2
```

- [ ] All 5 packages installed
- [ ] No version conflicts

**Backend:**
```bash
cd backend
npm list socket.io
cd ..
```

Expected: `socket.io@4.7.2`

- [ ] Socket.io installed

### Environment Setup
- [ ] Created `backend/.env` file
- [ ] DATABASE_URL set correctly
- [ ] PORT=3000
- [ ] SOCKET_IO_ENABLED=true
- [ ] DATABASE accessible: `psql -U postgres -c "SELECT 1"`

---

## Database Verification

### PostgreSQL Setup

**Check database exists:**
```bash
psql -U postgres -l | grep naijabasket
```

- [ ] Database "naijabasket" exists

**Check tables created:**
```bash
psql naijabasket -c "\dt"
```

Expected tables:
- [ ] customers
- [ ] products
- [ ] sales
- [ ] inventory_log
- [ ] expenses

**Check indexes:**
```bash
psql naijabasket -c "\di" | grep -E "idx_sales|idx_products|idx_customers"
```

Expected indexes:
- [ ] idx_sales_sale_date
- [ ] idx_sales_payment_status
- [ ] idx_sales_customer_id
- [ ] idx_products_quantity
- [ ] idx_customers_deleted_at

**Check sample data:**
```bash
psql naijabasket -c "SELECT COUNT(*) FROM customers;"
psql naijabasket -c "SELECT COUNT(*) FROM products;"
```

- [ ] Both return > 0

---

## Backend Verification

### Server Startup

**Terminal 1: Start backend**
```bash
cd backend
npm run dev
```

Expected console output:
```
[INFO] Server running on port 3000
[INFO] Connected to PostgreSQL
Socket.io listening...
```

Check for errors:
- [ ] No ECONNREFUSED errors
- [ ] No DATABASE_URL undefined errors
- [ ] No "Cannot find module" errors

### API Endpoint Testing

**Test health check (if exists):**
```bash
curl http://localhost:3000/health
```

Or test accounting endpoint:
```bash
curl http://localhost:3000/api/admin/accounting/products
```

Expected: JSON array of products

- [ ] Endpoint responds with data
- [ ] No 404 errors
- [ ] No database connection errors

**Test all endpoints:**

```bash
# Sales
curl http://localhost:3000/api/admin/accounting/sales

# Customers
curl http://localhost:3000/api/admin/accounting/customers

# Products
curl http://localhost:3000/api/admin/accounting/products

# Invoices (use first sale ID)
curl http://localhost:3000/api/admin/accounting/invoices/1

# Summary
curl http://localhost:3000/api/admin/accounting/sales/summary

# Daily
curl http://localhost:3000/api/admin/accounting/sales/daily?days=30
```

All should return JSON objects (even if empty):
- [ ] GET /sales → returns array
- [ ] GET /customers → returns array
- [ ] GET /products → returns array
- [ ] GET /sales/summary → returns object with totals
- [ ] GET /sales/daily → returns array of daily data

### Socket.io Verification

**Check Socket.io is listening:**
```bash
curl http://localhost:3000/socket.io/?EIO=4&transport=polling
```

Should return HTTP 200 with binary data.

- [ ] Socket.io server responding

---

## Frontend Verification

### Application Startup

**Terminal 2: Start frontend**
```bash
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

- [ ] Frontend server started on port 5173
- [ ] No compilation errors
- [ ] No missing module errors

### Login & Navigation

1. Open: `http://localhost:5173`
2. Login with: **admin** / **admin123**
3. Check nav buttons visible:
   - [ ] Shop button (🛍️)
   - [ ] Orders button (📦)
   - [ ] Admin button (⚙️)
   - [ ] **NEW: Accounting button (📊)** ← Must exist!

### Dashboard Access

1. Click "📊 Accounting" button
2. Dashboard should load:

Check for visible sections:
- [ ] Header "naijabasket Accounting Dashboard"
- [ ] Connection status shows (either 🟢 or 🔴)
- [ ] 4 KPI cards visible (Revenue, Transactions, Units, Pending)
- [ ] Chart area visible (even if empty)
- [ ] Filter bar visible with 5 inputs
- [ ] "Download Report (PDF)" button visible
- [ ] Sales table visible (columns: Date, Customer, Product, Qty, etc.)
- [ ] Customer panel on right sidebar
- [ ] Inventory panel on right sidebar

### No Errors Check

Press **F12** in browser → **Console** tab

- [ ] No red errors
- [ ] No 404 errors for imports
- [ ] No "Cannot read property" errors
- [ ] No blank screen (should show dashboard or loading state)

---

## Real-Time & Data Verification

### Socket.io Connection

In browser console (F12 → Console):
```javascript
// Type this:
typeof io
```

Should print: `"function"`

- [ ] Socket.io client library loaded

**Check connection status:**
Dashboard header should show either:
- [ ] 🟢 Live (Socket.io connected)
- [ ] 🔴 Offline (Socket.io not connected - may be normal if no real-time event fired yet)

### Create Test Sale

**Via SQL:**
```bash
psql naijabasket
```

Then:
```sql
INSERT INTO customers (name, phone, email, address, customer_type)
VALUES ('Test Customer', '08000000000', 'test@test.com', '100 Test St', 'retail')
RETURNING id;

-- Copy returned ID (let's say it's 1), then:

INSERT INTO sales (customer_id, product_id, quantity, unit_price, payment_method, payment_status)
VALUES (1, 1, 2, 4200, 'cash', 'paid');
```

- [ ] SQL executed without errors

**Refresh Dashboard:**
1. Press **F5** to reload
2. Check:
   - [ ] KPI cards now show numbers (not zero)
   - [ ] Sales table shows the new row
   - [ ] Chart displays a data point
   - [ ] Revenue shows ₦8,400 (2 × 4,200)

### Real-Time Socket.io Test

**If Socket.io shows 🟢 Live:**

1. In a second browser tab, go to backend terminal
2. Create another test sale
3. Watch dashboard in first tab:
   - [ ] KPI cards update automatically (no F5 needed)
   - [ ] New row appears in sales table
   - [ ] Chart updates
   - [ ] No need to refresh page

If Socket.io shows 🔴 Offline:
- This is fine if backend not configured yet
- Dashboard still works (just refresh manually with F5)

---

## Feature Verification

### Filter Bar

1. Set "Date From" to today
2. Click "Apply Filters"
3. Check:
   - [ ] KPI cards update
   - [ ] Sales table updates
   - [ ] Chart updates
   - [ ] All happen together

### Sales Table

1. Click column header "Date" to sort
   - [ ] Rows resort (ascending/descending toggle)
2. Click "Customer" header
   - [ ] Sorts by customer name
3. Navigate pagination:
   - [ ] Previous button works (greyed out on page 1)
   - [ ] Next button works
   - [ ] Shows correct page number

### View Invoice

1. Find a sale row in table
2. Click "👁️ Invoice" button
3. Modal opens:
   - [ ] Shows invoice number
   - [ ] Shows customer details
   - [ ] Shows product & quantity
   - [ ] Shows total amount
   - [ ] Shows payment method/status

### Print Invoice

In invoice modal:
1. Click "🖨️ Print" button
2. Browser print dialog should appear
   - [ ] Modal content appears in print preview
   - [ ] Can cancel or print

### Download Invoice PDF

In invoice modal:
1. Click "📥 Download PDF" button
2. File downloads to computer
   - [ ] Has filename like `INV-xxxx-xxxx.pdf`
   - [ ] Can open PDF in Acrobat/viewer
   - [ ] Shows same content as print

### Download Full Report

1. Click "📥 Download Report (PDF)" button
2. File downloads to computer
   - [ ] Has filename like `sales-report-2024-01-15.pdf`
   - [ ] File size > 100KB (includes chart)
   - [ ] Contains:
     - [ ] naijabasket header
     - [ ] KPI summary
     - [ ] Chart image
     - [ ] Sales table
     - [ ] Footer with timestamp

### Customer Panel

1. Scroll customer list on right panel
   - [ ] Shows all customers
   - [ ] Search box filters by name
   - [ ] Click customer highlights them
   - [ ] Shows customer stats (total spent, purchase count)

### Inventory Panel

1. Scroll inventory panel
   - [ ] Shows all products
   - [ ] Red alert box at top (if any low-stock items)
   - [ ] Stock bars show visual representation
   - [ ] Restock button works (if clicked)

---

## Performance Verification

### Page Load Time
1. Refresh dashboard page (F5)
2. Check browser DevTools (F12 → Network)
   - [ ] Page loads in < 3 seconds
   - [ ] KPI cards appear within 2 seconds
   - [ ] Chart appears within 3 seconds

### Table Pagination
1. Table with 15 rows per page
   - [ ] Page 1 shows rows 1-15
   - [ ] Page 2 shows rows 16-30
   - [ ] Pagination works smoothly

### Filter Performance
1. Apply filters
2. Check response time
   - [ ] Filters apply within 1 second
   - [ ] No "loading" message > 3 seconds

### Socket.io Latency
1. Create test sale in database
2. Watch dashboard update
   - [ ] Real-time update < 2 seconds after sale created
   - [ ] No lag or UI freeze

---

## Error Handling Verification

### Test Missing Data

1. In database, delete a customer:
```sql
UPDATE customers SET deleted_at = NOW() WHERE id = 1;
```

2. Refresh dashboard
   - [ ] Still works (uses soft deletes)
   - [ ] No crash

### Test Empty Filters

1. Set impossible filter (e.g., product="NonExistent")
2. Click "Apply Filters"
   - [ ] Dashboard shows empty state
   - [ ] No errors in console
   - [ ] Can clear filters

### Test API Timeout

1. Stop backend server (Ctrl+C)
2. Try to filter in dashboard
   - [ ] Shows error message (network error)
   - [ ] Not a blank page
   - [ ] Can recover when backend restarts

---

## TypeScript Compilation

### Run type check:
```bash
npx tsc --noEmit
```

Expected:
- [ ] No errors
- [ ] No "Cannot find module" warnings
- [ ] All types resolved

---

## Mobile Responsiveness

### Test on mobile device or browser zoom:

**Zoom to 50% (mobile view):**

1. Press **F12** in browser
2. Click device toggle (📱 icon)
3. Select "iPhone 12" or similar
4. Check dashboard:
   - [ ] KPI cards stack vertically
   - [ ] Chart still visible
   - [ ] Filter inputs stack
   - [ ] Table scrollable horizontally
   - [ ] Customer/inventory panels stack below
   - [ ] No horizontal scroll on body
   - [ ] Text readable (not tiny)

---

## Final Verification Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database | ✅✅✅ | 5 tables, indexes, sample data |
| Backend API | ✅✅✅ | 20+ endpoints, no errors |
| Socket.io | ✅✅✅ | Server & client configured |
| Frontend Render | ✅✅✅ | All 9 components show |
| KPI Cards | ✅✅✅ | Show correct data |
| Chart | ✅✅✅ | Displays 30-day trend |
| Filters | ✅✅✅ | Apply to all sections |
| Table | ✅✅✅ | Sort & pagination |
| Customer Panel | ✅✅✅ | Search & select |
| Inventory | ✅✅✅ | Stock alerts |
| Invoice Modal | ✅✅✅ | Print & PDF |
| PDF Report | ✅✅✅ | Download works |
| Real-Time | ✅✅✅ | Socket.io events |
| Responsive | ✅✅✅ | Mobile-friendly |
| No Errors | ✅✅✅ | Console clean |

---

## ✅ Dashboard is Ready When:

- [x] All 9 components render without errors
- [x] Data flows from database → API → frontend
- [x] Real-time Socket.io events fire
- [x] PDF export works
- [x] Filters apply correctly
- [x] No TypeScript errors
- [x] Responsive on mobile
- [x] Performance acceptable

**Run this checklist after setup. If all items checked, your dashboard is production-ready! 🎉**

---

## Quick Diagnostic Command

If something breaks, run this to diagnose:

```bash
# Database
echo "=== DATABASE ===" && psql naijabasket -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';" && echo ""

# Backend
echo "=== BACKEND ===" && curl -s http://localhost:3000/api/admin/accounting/products | jq 'length' && echo ""

# Frontend
echo "=== FRONTEND ===" && curl -s http://localhost:5173 | head -1 && echo ""
```

Expected output:
```
=== DATABASE ===
 tables
--------
      5
(1 row)

=== BACKEND ===
4

=== FRONTEND ===
<!DOCTYPE html>
```

If any fails, check the corresponding section of QUICK_START.md
