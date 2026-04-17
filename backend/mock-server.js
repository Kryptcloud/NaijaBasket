// Mock API server for testing payment flow without PostgreSQL
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const orders = {}; // In-memory order storage
let adminPassword = 'Admin@123'; // Changeable admin password
const users = {}; // In-memory user storage: phone/email -> { name, email, phone, verified, otp, otpExpires }
const otpStore = {}; // channel (phone/email) -> { code, expires }

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Mock server running' });
});

// Create order
app.post('/api/orders', (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;
    
    if (!items || !deliveryAddress || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = `ECH-${Date.now().toString().slice(-6)}`;
    const order = {
      id: orderId,
      items,
      deliveryAddress,
      paymentMethod,
      status: 'Pending Payment',
      createdAt: new Date()
    };

    orders[orderId] = order;

    res.json({ 
      success: true,
      order: { id: orderId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize Paystack payment
app.post('/api/payments/paystack/initialize', (req, res) => {
  try {
    const { orderId, email, amount } = req.body;

    // Mock Paystack response
    const reference = `REF-${Date.now()}`;
    const authorizationUrl = `https://checkout.paystack.com/c/${reference}`;

    res.json({
      status: true,
      message: 'Authorization URL created',
      data: {
        authorizationUrl,
        accessCode: `access_code_${reference}`,
        reference
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initiate crypto payment
app.post('/api/payments/crypto/initiate', (req, res) => {
  try {
    const { orderId, walletAddress } = req.body;

    res.json({
      status: true,
      message: 'Crypto payment initiated',
      data: {
        merchantAddress: '0x4978D9a8dD862B066c61c51228310fa10134979f',
        supportedNetworks: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum'],
        orderId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment status
app.get('/api/payments/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      status: true,
      data: {
        orderId,
        paymentStatus: 'pending',
        order
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json({ orders: Object.values(orders) });
});

// Mock auth login (for dev testing only)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Accept any email with current admin password
  if (password === adminPassword) {
    res.json({
      message: 'Login successful',
      user: {
        id: 'mock-admin-001',
        email: email,
        name: 'Admin',
        role: 'admin',
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Change admin password (owner/super admin)
app.post('/api/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token-')) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (currentPassword !== adminPassword) {
    return res.status(403).json({ error: 'Current password is incorrect.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  adminPassword = newPassword;
  res.json({ message: 'Password changed successfully.' });
});

// ======== CUSTOMER SIGNUP & OTP ========

// Generate 6-digit OTP
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Send OTP to phone or email
app.post('/api/auth/send-otp', (req, res) => {
  const { channel, value } = req.body; // channel: "phone" | "email", value: the phone/email

  if (!channel || !value) {
    return res.status(400).json({ error: 'Channel and value are required.' });
  }

  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (channel === 'phone' && !/^(\+?234|0)[789]\d{9}$/.test(value.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid Nigerian phone number.' });
  }

  const code = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore[value] = { code, expires };

  // In production, send via SMS gateway (e.g. Termii) or email (e.g. SendGrid)
  console.log(`📱 OTP for ${value}: ${code}`);

  res.json({ 
    success: true, 
    message: `OTP sent to ${channel === 'phone' ? 'phone number' : 'email address'}.`,
    // ONLY for dev/testing — remove in production
    devOtp: code 
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { channel, value, code } = req.body;

  if (!value || !code) {
    return res.status(400).json({ error: 'Value and OTP code are required.' });
  }

  const stored = otpStore[value];
  if (!stored) {
    return res.status(400).json({ error: 'No OTP was sent to this address. Please request a new one.' });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[value];
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }

  // OTP verified — clean up
  delete otpStore[value];
  res.json({ success: true, verified: true });
});

// Customer signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Check duplicates
  if (users[email]) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  if (users[phone]) {
    return res.status(409).json({ error: 'An account with this phone number already exists.' });
  }

  const userId = 'usr-' + Date.now().toString(36);
  const user = {
    id: userId,
    name,
    email,
    phone,
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date().toISOString(),
  };

  users[email] = user;
  users[phone] = user;

  const token = 'nb-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

  res.json({
    success: true,
    user: { id: userId, name, email, phone },
    token,
  });
});

// Google OAuth mock — simulate Google login returning user info
app.post('/api/auth/google', (req, res) => {
  const { googleToken, name, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google login.' });
  }

  // If user exists, log them in; otherwise create account
  let user = users[email];
  if (!user) {
    const userId = 'usr-' + Date.now().toString(36);
    user = {
      id: userId,
      name: name || email.split('@')[0],
      email,
      phone: '',
      emailVerified: true, // Google verifies email
      phoneVerified: false,
      createdAt: new Date().toISOString(),
    };
    users[email] = user;
  }

  const token = 'nb-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    token,
    needsPhone: !user.phone, // If Google login, they still need to add phone
  });
});

// ======== CUSTOMER LOGIN BY EMAIL (OTP-based) ========
app.post('/api/auth/customer-login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const user = users[email.toLowerCase().trim()];
  if (!user) return res.status(404).json({ success: false, error: 'No account found.' });
  const token = 'nb-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  res.json({ success: true, user, token });
});

// ======== USER PROFILE UPDATE ========
app.patch('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // Find user by id across all keys
  const key = Object.keys(users).find(k => users[k]?.id === id);
  if (!key) return res.status(404).json({ error: 'User not found.' });
  Object.assign(users[key], updates);
  res.json({ success: true, user: users[key] });
});

// ======== REVIEWS ========
const reviewsStore = [];

app.get('/api/reviews', (req, res) => {
  res.json({ success: true, reviews: reviewsStore });
});

app.post('/api/reviews', (req, res) => {
  const review = req.body;
  if (!review || !review.productId) return res.status(400).json({ error: 'Review data required.' });
  review.id = review.id || `rev_${Date.now()}`;
  review.date = review.date || new Date().toISOString().slice(0, 10);
  reviewsStore.push(review);
  res.json({ success: true, review });
});

// ======== DELIVERY ZONES ========
let deliveryZonesStore = [];

app.get('/api/delivery-zones', (req, res) => {
  res.json({ success: true, zones: deliveryZonesStore });
});

app.put('/api/delivery-zones', (req, res) => {
  const { zones } = req.body;
  if (!Array.isArray(zones)) return res.status(400).json({ error: 'zones array required.' });
  deliveryZonesStore = zones;
  res.json({ success: true, zones: deliveryZonesStore });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Mock API Server running at http://localhost:${PORT}`);
  console.log('📋 Ready for testing payment flow');
});
