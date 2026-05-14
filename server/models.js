// ─── models/index.js ─────────────────────────────────────
const mongoose = require('mongoose');

// ── Settings (password + theme) ──────────────────────────
const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// ── Product / Stock ───────────────────────────────────────
const productSchema = new mongoose.Schema({
  uid:       { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  qty:       { type: Number, default: 0 },
  price:     { type: Number, default: 0 },
  alertAt:   { type: Number, default: 3 },
}, { timestamps: true });

// ── Customer / User ───────────────────────────────────────
const customerSchema = new mongoose.Schema({
  uid:            { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  phone:          { type: String, default: '' },
  balance:        { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  totalReturned:  { type: Number, default: 0 },
}, { timestamps: true });

// ── Transaction ───────────────────────────────────────────
const txnSchema = new mongoose.Schema({
  uid:      { type: String, required: true, unique: true },
  ts:       { type: Number, default: Date.now },
  type:     { type: String },
  userId:   { type: String },
  userName: { type: String },
  product:  { type: String },
  qty:      { type: Number },
  rate:     { type: Number },
  price:    { type: Number },
  total:    { type: Number },
  reason:   { type: String },
  note:     { type: String },
}, { timestamps: true });

module.exports = {
  Settings:  mongoose.model('Settings',  settingsSchema),
  Product:   mongoose.model('Product',   productSchema),
  Customer:  mongoose.model('Customer',  customerSchema),
  Txn:       mongoose.model('Txn',       txnSchema),
};
