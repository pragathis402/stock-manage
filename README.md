# 🛢️ OilShop Manager — with MongoDB Backend

A complete oil shop management system with:
- **MongoDB database** for persistent storage
- **Express.js REST API** backend
- **Session-based authentication** with bcrypt password hashing
- **Fixed login page** (error shown correctly after submit, not on load)

---

## 📁 Project Structure

```
oilshop-app/
├── server/
│   ├── index.js       ← Express app + all API routes
│   └── models.js      ← Mongoose schemas (Product, Customer, Txn, Settings)
├── public/
│   └── index.html     ← Full frontend (unchanged look, MongoDB-backed)
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

**macOS (Homebrew):**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:** Download from https://www.mongodb.com/try/download/community

### 2. Install dependencies

```bash
cd oilshop-app
npm install
```

### 3. Configure (optional)

Copy `.env.example` to `.env` and edit:
```bash
cp .env.example .env
```

### 4. Start the server

```bash
npm start
```

Open http://localhost:3000 in your browser.

---

## 🔐 Login

**Default password:** `shop123`

You can change it from **Settings → Change Password** inside the app.

---

## 🗄️ MongoDB Collections

| Collection  | Purpose                              |
|-------------|--------------------------------------|
| `settings`  | App password (bcrypt), theme         |
| `products`  | Stock items (oil types, qty, price)  |
| `customers` | Customer records and balances        |
| `txns`      | All transactions (sales, payments…)  |

---

## 🔧 Environment Variables

| Variable         | Default                              | Description           |
|------------------|--------------------------------------|-----------------------|
| `PORT`           | `3000`                               | Server port           |
| `MONGO_URI`      | `mongodb://127.0.0.1:27017/oilshop`  | MongoDB connection    |
| `SESSION_SECRET` | `oilshop-secret-2024`                | Session signing key   |

---

## 🐛 Login Bug Fixed

**Original bug:** The error message `<p>` was placed *above* the password `<input>` in the HTML, so it appeared visually in the wrong place and was always rendered (just hidden).

**Fix:** Moved the error element to *after* the input field, and it now starts empty — only filled with a message on failed login.
