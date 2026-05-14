// ─── server/index.js ──────────────────────────────────────
'use strict';

const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const path     = require('path');

const { Settings, Product, Customer, Txn } = require('./models');

// ── Config ────────────────────────────────────────────────
const PORT       = process.env.PORT       || 3000;
const MONGO_URI  = process.env.MONGO_URI  || 'mongodb://127.0.0.1:27017/oilshop';
const SECRET     = process.env.SESSION_SECRET || 'oilshop-secret-2024';
const DEFAULT_PW = 'shop123';

// ── Connect to MongoDB ────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected:', MONGO_URI);
    // Seed default password if not set
    const existing = await Settings.findOne({ key: 'password' });
    if (!existing) {
      const hash = await bcrypt.hash(DEFAULT_PW, 10);
      await Settings.create({ key: 'password', value: hash });
      console.log('🔑 Default password set: shop123');
    }
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── Express App ───────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// ── Auth middleware ───────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ═══════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    const setting = await Settings.findOne({ key: 'password' });
    if (!setting) return res.status(500).json({ error: 'Server config error' });
    const match = await bcrypt.compare(password, setting.value);
    if (!match) return res.status(401).json({ error: 'Wrong password' });
    req.session.loggedIn = true;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// GET /api/auth — check session
app.get('/api/auth', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

// POST /api/change-password
app.post('/api/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password required' });
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await Settings.findOneAndUpdate({ key: 'password' }, { value: hash }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════

app.get('/api/settings/:key', requireAuth, async (req, res) => {
  const s = await Settings.findOne({ key: req.params.key });
  res.json({ value: s ? s.value : null });
});

app.post('/api/settings/:key', requireAuth, async (req, res) => {
  const { value } = req.body;
  await Settings.findOneAndUpdate({ key: req.params.key }, { value }, { upsert: true, new: true });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════════════════

// GET all
app.get('/api/products', requireAuth, async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json(products.map(docToObj));
});

// POST create or upsert
app.post('/api/products', requireAuth, async (req, res) => {
  const { uid, name, qty, price, alertAt, createdAt } = req.body;
  try {
    const doc = await Product.findOneAndUpdate(
      { uid },
      { uid, name, qty, price, alertAt },
      { upsert: true, new: true }
    );
    res.json(docToObj(doc));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT update
app.put('/api/products/:uid', requireAuth, async (req, res) => {
  const doc = await Product.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(docToObj(doc));
});

// DELETE
app.delete('/api/products/:uid', requireAuth, async (req, res) => {
  await Product.findOneAndDelete({ uid: req.params.uid });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════
//  CUSTOMERS
// ═══════════════════════════════════════════════════════════

app.get('/api/customers', requireAuth, async (req, res) => {
  const docs = await Customer.find().sort({ createdAt: 1 });
  res.json(docs.map(docToObj));
});

app.post('/api/customers', requireAuth, async (req, res) => {
  const { uid, name, phone, balance, totalPurchased, totalReturned } = req.body;
  try {
    const doc = await Customer.findOneAndUpdate(
      { uid },
      { uid, name, phone, balance, totalPurchased, totalReturned },
      { upsert: true, new: true }
    );
    res.json(docToObj(doc));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/customers/:uid', requireAuth, async (req, res) => {
  const doc = await Customer.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(docToObj(doc));
});

app.delete('/api/customers/:uid', requireAuth, async (req, res) => {
  await Customer.findOneAndDelete({ uid: req.params.uid });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════
//  TRANSACTIONS
// ═══════════════════════════════════════════════════════════

app.get('/api/txns', requireAuth, async (req, res) => {
  const docs = await Txn.find().sort({ ts: 1 });
  res.json(docs.map(docToObj));
});

app.post('/api/txns', requireAuth, async (req, res) => {
  const data = req.body;
  try {
    const doc = await Txn.create(data);
    res.json(docToObj(doc));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/txns', requireAuth, async (req, res) => {
  await Txn.deleteMany({});
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════
//  BULK DATA (for full page load)
// ═══════════════════════════════════════════════════════════
app.get('/api/data', requireAuth, async (req, res) => {
  const [products, customers, txns, themeSetting] = await Promise.all([
    Product.find().sort({ createdAt: 1 }),
    Customer.find().sort({ createdAt: 1 }),
    Txn.find().sort({ ts: 1 }),
    Settings.findOne({ key: 'theme' }),
  ]);
  res.json({
    products: products.map(docToObj),
    users:    customers.map(docToObj),
    txns:     txns.map(docToObj),
    theme:    themeSetting ? themeSetting.value : 'light',
  });
});

// ── Utility ───────────────────────────────────────────────
function docToObj(doc) {
  const obj = doc.toObject();
  delete obj._id; delete obj.__v;
  return obj;
}

// ── Fallback → SPA ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🛢️  OilShop Manager running at http://localhost:${PORT}`);
});
