# SecurePay Intelligence

AI-Powered Secure Payment Processing, Fraud Detection and Business Intelligence Platform.
Prototype/MVP built per the project documentation (Payment Processing, Data Science/Fraud
Detection, Cybersecurity, Business Intelligence, NLP).

This repo contains a working **Node.js/Express + MongoDB backend** and a **React/Vite
frontend**, seeded with the 10,000-row analyzed transaction dataset. The backend serves the
built frontend directly, so the whole thing runs and deploys as **one service, one start
command** — same pattern as your other apps.

## What's implemented

| Area | Status |
|---|---|
| Payment processing (simulated) | ✅ create/list transactions, receipts via API |
| Cybersecurity (Daniel) | ✅ JWT auth, bcrypt, RBAC, account lockout, audit trail (SecurityEvent), fraud alerts, security dashboard |
| Fraud detection / risk scoring | ✅ rule-based MVP scorer (`utils/fraudDetection.js`) — swap for Mellon's ML model later |
| Business Intelligence (Janet) | ✅ KPIs, payment method breakdown, customer segmentation |
| NLP Assistant | ✅ keyword-based Q&A MVP (`controllers/nlpController.js`) — swap for real NLP/LLM later |
| Frontend | ✅ login/register, role-aware dashboard, transactions, security ops page, NLP chat |

## Project structure

```
securepay-intelligence/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, Transaction, SecurityEvent, FraudAlert
│   ├── middleware/                # auth (JWT), rbac, securityLogger (audit trail)
│   ├── controllers/               # auth, transactions, security, bi, nlp
│   ├── routes/
│   ├── utils/fraudDetection.js    # rule-based risk scorer (placeholder for ML model)
│   ├── scripts/                   # seedUsers.js, seedTransactions.js
│   ├── data/securepay_transactions_analyzed.csv
│   └── server.js
└── frontend/
    └── src/
        ├── api/api.js              # axios client w/ JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/             # Navbar, ProtectedRoute
        └── pages/                  # Login, Register, Dashboard, Transactions, SecurityAlerts, NLPAssistant
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) OR a free MongoDB Atlas connection string

## Quick start (one command, from repo root)

```bash
npm run install:all        # installs backend + frontend deps
cp backend/.env.example backend/.env   # edit JWT_SECRET / MONGO_URI
npm run seed:users
npm run seed:transactions

npm run build               # builds the frontend into frontend/dist
npm start                   # ONE command — backend serves the built frontend too
```

Open `http://localhost:5000` — frontend and API are both served from that single port/process.

For active development with hot-reload on both sides instead, use:

```bash
npm run dev   # runs backend (nodemon) + frontend (vite) together, proxied
```

That opens the frontend dev server on `http://localhost:5173`, which proxies `/api` calls to
the backend on `:5000` — no CORS setup needed either way.

## Deploying to Render (or Railway) as one service

Same shape as your other projects — push to GitHub, connect the repo, and set:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment variables:** `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`
  (and optionally `MAX_FAILED_LOGIN_ATTEMPTS`, `FAILED_LOGIN_WINDOW_MINUTES`)
- **Root directory:** repo root (the root `package.json` drives both the backend and frontend
  builds — no need to configure two separate services)

Render assigns `PORT` automatically; the backend already reads `process.env.PORT`. No separate
static site or `CLIENT_URL`/CORS setup is needed — the Express server serves the built frontend
from the same origin once `npm run build` has run.

## Manual / separate setup (if you ever want to split frontend and backend)

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if needed — at minimum set a real JWT_SECRET
```

Start MongoDB locally (if not already running):

```bash
mongod --dbpath ~/mongodb-data   # or however you normally start it
```

Seed test users (one per role) and import the transaction dataset:

```bash
npm run seed:users
npm run seed:transactions
```

Run the API:

```bash
npm run dev        # nodemon, auto-reload
# or
npm start
```

API runs on `http://localhost:5000`. Health check: `GET /api/health`.

### Seeded test accounts (password for all: `ChangeMe123!`)

| Role | Email |
|---|---|
| security_admin | security.admin@securepay.test |
| business_manager | manager@securepay.test |
| admin | admin@securepay.test |
| customer | customer@securepay.test |

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm run dev
```

Frontend runs on `http://localhost:5173`. Log in with one of the seeded accounts above.

- **customer** role → sees only the basic dashboard (can simulate a payment via API, no BI/security views)
- **admin / business_manager** → Dashboard + Transactions + NLP Assistant
- **security_admin / admin** → Security Operations page (audit trail, fraud alerts, lockouts)

## 3. Key API endpoints

```
POST   /api/auth/register          { name, email, password }
POST   /api/auth/login             { email, password }
GET    /api/auth/me
POST   /api/auth/logout

POST   /api/transactions           simulate a payment (any authenticated user)
GET    /api/transactions           list (admin/business_manager/security_admin)
GET    /api/transactions/:id

GET    /api/security/dashboard     security_admin/admin
GET    /api/security/events        audit trail
GET    /api/security/alerts        fraud alerts
PATCH  /api/security/alerts/:id    { status }

GET    /api/bi/kpis
GET    /api/bi/payment-methods
GET    /api/bi/customers/segments

POST   /api/nlp/ask                { question }
```
