// NaijaBasket API Server — JSON file persistence
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===== JSON file persistence helpers =====
function loadData(file, defaultVal = []) {
  const fp = path.join(DATA_DIR, file);
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    return defaultVal;
  } catch { return defaultVal; }
}

function saveData(file, data) {
  const fp = path.join(DATA_DIR, file);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
}

// Load persisted data
let orders = loadData('orders.json', []);
let products = loadData('products.json', []);
let users = loadData('users.json', []);
let expenses = loadData('expenses.json', []);
let reviews = loadData('reviews.json', []);
let conversations = loadData('conversations.json', []);
let config = loadData('config.json', { adminPassword: 'admin123' });

// ===== Middleware =====
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '5mb' })); // 5mb for base64 images

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (!req.path.includes('/health')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// ===== Health =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), orders: orders.length, products: products.length, users: users.length });
});

// ===== AUTH =====

// Admin login
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@naijabasket.com' && password === config.adminPassword) {
    const token = 'admin_' + crypto.randomBytes(16).toString('hex');
    return res.json({ success: true, token, user: { id: 'admin', name: 'Admin', email, role: 'admin' } });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Change admin password
app.post('/api/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword !== config.adminPassword) return res.status(403).json({ error: 'Current password is incorrect' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  config.adminPassword = newPassword;
  saveData('config.json', config);
  res.json({ success: true, message: 'Password changed' });
});

// Customer signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const user = {
    id: `u_${Date.now()}`,
    name, email: email.toLowerCase().trim(), phone: phone || '',
    emailVerified: false, phoneVerified: false,
    loyaltyPoints: 0,
    referralCode: name.slice(0, 3).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveData('users.json', users);
  const token = 'tok_' + crypto.randomBytes(16).toString('hex');
  res.json({ success: true, user, token });
});

// Customer login (find existing user)
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'No account found with that email' });
  
  const token = 'tok_' + crypto.randomBytes(16).toString('hex');
  res.json({ success: true, user, token });
});

// Update user (verification status, loyalty points, etc.)
app.patch('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id, email: users[idx].email };
  saveData('users.json', users);
  res.json({ success: true, user: users[idx] });
});

// ===== ORDERS =====

// Create order
app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.items || !order.customer) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  // Ensure order has an ID
  if (!order.id) order.id = `NB-${Date.now().toString(36).toUpperCase()}`;
  order.syncedAt = new Date().toISOString();
  
  // Check if order already exists (idempotency)
  const existing = orders.findIndex(o => o.id === order.id);
  if (existing >= 0) {
    orders[existing] = { ...orders[existing], ...order };
  } else {
    orders.unshift(order);
  }
  saveData('orders.json', orders);
  res.json({ success: true, order });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders });
});

// Update order status
app.patch('/api/orders/:id', (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id };
  saveData('orders.json', orders);
  res.json({ success: true, order: orders[idx] });
});

// ===== PRODUCTS =====

// Get all products
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

// Sync products (bulk upsert from admin)
app.put('/api/products', (req, res) => {
  const incoming = req.body.products;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'products array required' });
  products = incoming;
  saveData('products.json', products);
  res.json({ success: true, count: products.length });
});

// Update single product
app.patch('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products[idx] = { ...products[idx], ...req.body, id };
  saveData('products.json', products);
  res.json({ success: true, product: products[idx] });
});

// ===== EXPENSES =====

app.get('/api/expenses', (req, res) => {
  res.json({ success: true, expenses });
});

app.post('/api/expenses', (req, res) => {
  const expense = req.body;
  if (!expense.id) expense.id = `exp_${Date.now()}`;
  expenses.push(expense);
  saveData('expenses.json', expenses);
  res.json({ success: true, expense });
});

app.delete('/api/expenses/:id', (req, res) => {
  expenses = expenses.filter(e => e.id !== req.params.id);
  saveData('expenses.json', expenses);
  res.json({ success: true });
});

// ===== REVIEWS =====

app.get('/api/reviews', (req, res) => {
  res.json({ success: true, reviews });
});

app.post('/api/reviews', (req, res) => {
  const review = req.body;
  if (!review.id) review.id = `rev_${Date.now()}`;
  reviews.push(review);
  saveData('reviews.json', reviews);
  res.json({ success: true, review });
});

// ===== CONVERSATIONS (Admin Chat) =====

app.get('/api/conversations', (req, res) => {
  res.json({ success: true, conversations });
});

app.put('/api/conversations', (req, res) => {
  conversations = req.body.conversations || [];
  saveData('conversations.json', conversations);
  res.json({ success: true });
});

// ===== STATS (Admin Dashboard) =====
app.get('/api/stats', (req, res) => {
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'confirming');
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalCustomers = users.length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  
  res.json({
    success: true,
    stats: { totalOrders, totalRevenue, pendingOrders, totalCustomers, totalExpenses }
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ NaijaBasket API Server running at http://localhost:${PORT}`);
  console.log(`📦 Data: ${orders.length} orders, ${products.length} products, ${users.length} users`);
});
