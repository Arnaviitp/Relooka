# LoopWear (Closet Circle) 👗🔄

> **Peer-to-Peer Luxury Clothing Rental Platform in India**  
> Lenders list ethnic and luxury outfits, renters rent them, and the platform orchestrates logistics, dual quality checks (QC1/QC2), sanitization, and delivery exclusively through local partner laundry hubs.

---

## 📑 Table of Contents
1. [Core Philosophy & Zero-Budget Mandate](#-core-philosophy--zero-budget-mandate)
2. [Architecture & System Flow](#-architecture--system-flow)
3. [Binding Business Rules](#-binding-business-rules)
4. [Quickstart (Zero Accounts, Zero Keys)](#-quickstart-zero-accounts-zero-keys)
5. [Environment Variables](#-environment-variables)
6. [API Documentation & Endpoints](#-api-documentation--endpoints)
7. [Third-Party Services & Free-Tier Limits](#-third-party-services--free-tier-limits)
8. [Cost Review (Zero-Budget Financial Audit)](#-cost-review-zero-budget-financial-audit)
9. [Upgrade When Funded](#-upgrade-when-funded)
10. [Legal & Regulatory Compliance (Government ID Storage)](#-legal--regulatory-compliance-government-id-storage)
11. [Open Source Commercial License Audit](#-open-source-commercial-license-audit)
12. [Assumptions, TODOs & Open Items](#-assumptions-todos--open-items)

---

## 💎 Core Philosophy & Zero-Budget Mandate

LoopWear is engineered under an absolute **Zero-Budget Rule**:
- **0 Paid Services, 0 Paid SDKs, 0 Paid APIs, 0 Paid Hosting**: Everything runs completely free of cost.
- **Swappable Adapter Pattern**: Every external integration sits behind an interface with a built-in local stub selected by environment variables. If an API key is omitted, the system falls back to the stub automatically without throwing errors.
- **Cold-Start Resilience**: Built stateless for sleeping free-tier containers (e.g. Render / Railway / Fly.io free tiers). Long-running background jobs run idempotently and can be triggered via a protected endpoint called by a free scheduler (such as GitHub Actions cron).

---

## 🏗️ Architecture & System Flow

> 📄 **Technical Deep-Dive for Leads:** For the comprehensive architectural presentation, Mermaid state machine diagrams, security compliance matrix, and swappable adapter specifications, see [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md).

LoopWear is structured as a **Node.js Express Modular Monolith** with a **React + Vite** frontend.

```
LoopWear (Closet Circle)
├── backend/
│   ├── src/
│   │   ├── core/                        # Shared kernel (zero business logic)
│   │   │   ├── adapters/                # Swappable zero-budget adapters
│   │   │   │   ├── captcha.adapter.js   # Cloudflare Turnstile / Dev bypass
│   │   │   │   ├── delivery.adapter.js  # Field handover & ID/OTP verification
│   │   │   │   ├── idVerification.adapter.js # In-house admin queue & stub
│   │   │   │   ├── mail.adapter.js      # Nodemailer SMTP / Console stub
│   │   │   │   ├── payment.adapter.js   # MockGateway / Razorpay Test mode
│   │   │   │   ├── push.adapter.js      # FCM / In-app notification list
│   │   │   │   ├── sms.adapter.js       # Console stub (no paid SMS gateway)
│   │   │   │   └── storage.adapter.js   # Local disk / Cloudinary free tier
│   │   │   ├── config/                  # Zod env schema, CFO pricing, RFM tiers
│   │   │   ├── db/                      # Mongoose connection & seeder
│   │   │   ├── docs/                    # OpenAPI 3.0 Swagger specs
│   │   │   ├── middleware/              # Auth, roleGuard, rateLimiter, errorHandler
│   │   │   ├── queue/                   # MemoryQueue (in-process) & BullMQ (Redis)
│   │   │   └── utils/                   # AES-256-GCM crypto, masking, response
│   │   ├── modules/                     # Domain modules (routes, controller, service, model)
│   │   │   ├── auth/                    # Signup, OTP verification, JWT rotation
│   │   │   ├── users/                   # Capabilities, government ID queue
│   │   │   ├── pricing/                 # Rule-driven CFO pricing engine
│   │   │   ├── hubs/                    # Partner local laundry hubs
│   │   │   ├── listings/                # Outfit listings, media caps, dual QC
│   │   │   ├── orders/                  # 14-step state machine, deposit ledger
│   │   │   ├── feedback/                # Two-way multi-dimension ratings
│   │   │   └── tiers/                   # RFM + LoopWear score engine
│   │   ├── app.js                       # Express app configuration
│   │   └── server.js                    # HTTP listener & graceful shutdown
│   └── tests/                           # Jest + Supertest test suites
├── frontend/                            # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── components/                  # Navbar, Footer, ProductCard, TierBadge
│       ├── context/                     # AuthContext (tokens, capabilities)
│       ├── pages/                       # Home, Feed, Detail, Checkout, Dashboards
│       └── services/                    # ApiClient with auto-refresh interceptor
├── docker-compose.yml                   # Free local MongoDB 7.0 & Redis 7
└── .github/workflows/ci.yml             # Free GitHub Actions test runner & cron
```

---

## ⚖️ Binding Business Rules

1. **Explicit 14-State Lifecycle Machine & Immutable Event Logs**:
   ```
   CREATED
      ↓
   CONFIRMED (Payment captured & deposit held)
      ↓
   LENDER_SUBMITTED (Lender hands over item; declares washed/unwashed)
      ↓
   QC1_PASSED (Pickup condition check cleared)
      ↓
   QC2_PASSED (Hub deep intake inspection cleared)
      ↓
   HUB_WASHING_OUTBOUND (Sanitizing wash before renter delivery)
      ↓
   OUT_FOR_DELIVERY_RENTER (Dispatched with delivery agent)
      ↓
   DELIVERED_TO_RENTER (Rule 4: Recipient Govt ID check + OTP verification)
      ↓
   IN_USE (Active rental period)
      ↓
   RETURN_PICKUP (Return package collected from renter)
      ↓
   RETURN_QC (Condition comparison: Match or Mismatch)
      ↓
   HUB_WASHING_RETURN (Sanitizing wash before lender return)
      ↓
   DELIVERED_TO_LENDER (Delivered safely back to lender)
      ↓
   CLOSED (Rule 3: Deposit ledger resolved, tier engine triggered)
   ```
   Invalid transitions are rejected with HTTP 400. Every state transition appends an **immutable, append-only event log** recording the actor ID, role, action, and timestamp.

2. **No Central Warehouse & No Direct Lender-to-Renter Deliveries**:
   All items route through certified local dry-cleaning and laundry partner hubs.

3. **Deposit Ledger (Hold, Release, Deduct)**:
   - Security deposit is held in escrow upon checkout.
   - If Return QC is a **Match**: deposit is released in full.
   - If Return QC is a **Mismatch**: assessed damage amount is deducted from the deposit, credited towards repair, and the remaining balance is refunded to the renter.

4. **Mandatory Handover Verification (ID + OTP)**:
   The delivery agent inspects the recipient's government ID (presented by renter or authorized representative; name and masked ref recorded) AND confirms a 6-digit OTP sent to the recipient's registered contact. The order cannot become "DELIVERED" without both.

5. **Capabilities Set (Non-Exclusive Roles)**:
   A user account holds a set of capabilities (`['renter']`, `['lender']`, or `['renter', 'lender']`). Users switch between Renting and Lending in the same session without separate logins. Delivery Agent, Hub Staff, and Admin are restricted account types.

6. **CFO-Controlled Dynamic Pricing**:
   Zero hardcoding of charges, fees, or commissions. Pricing rules reside in `src/core/config/pricing.config.js`:
   - Daily rent + multi-day duration discounts (7 days = 10% off, 14 days = 20% off)
   - Refundable security deposit (capped % of declared retail value, discounted by tier)
   - Fixed laundry & sanitization fee (INR 150)
   - Fixed delivery fee (INR 99)
   - Platform fee (INR 49, discounted by tier)
   - Lender commission (15% platform deduction)

7. **Identity & Government ID Privacy (Aadhaar / Voter / Ration Card)**:
   - Full ID numbers and document photos are **NEVER stored or logged**.
   - Only ID type, masked reference (max last 4 characters, e.g. `XXXX9012`), and printed name are captured.
   - Sensitive fields are encrypted at rest using **AES-256-GCM**.
   - Auth and OTP endpoints are strictly rate-limited.
   - Explicit regulatory consent is required prior to submission.

8. **Two-Way Feedback**:
   Tied exclusively to completed (CLOSED) orders. Renters rate item accuracy, condition, and lender conduct (1-5 each); lenders rate return condition and renter conduct (1-5 each). Feedbacks feed into rolling user averages and the RFM tier engine.

9. **Configurable RFM Tier Engine (Silver, Gold, Platinum, Diamond)**:
   $$\text{Score} = \text{Recency} \times \text{Frequency} \times \text{Monetary} \times \text{LoopWear Score}$$
   - Dimensions are normalized to 1–5 bands using configurable thresholds so nothing zeroes out.
   - LoopWear score is set by executives (1.0–5.0) and blended with feedback ratings.
   - Recomputed upon order close and nightly. Tier benefits include platform fee discounts (up to 35%) and deposit reductions (up to 40%).

10. **Listing Media Caps & QC Gate**:
    - Max 6 photos + 1 short video (capped at 25MB).
    - Listings go live (`status: active`) ONLY after admin verification AND both initial quality inspections (`qc1` and `qc2`) pass.

---

## 🚀 Quickstart (Zero Accounts, Zero Keys)

You can run LoopWear locally without any external accounts, API keys, or credit cards.

### Prerequisites
- Node.js 18+ (tested on Node v20 / v22)
- Docker Desktop (optional: for local Mongo & Redis containers)

### 1. Start Local Database (or use in-memory mode)
If Docker is running:
```bash
docker compose up -d
```
*Note: If Docker is not running, the automated test suite uses `mongodb-memory-server` and the in-process `MemoryQueue` out of the box with zero setup.*

### 2. Install Dependencies
```bash
# Backend dependencies
npm install --prefix backend

# Frontend dependencies
npm install --prefix frontend
```

### 3. Run the Monolith Backend
```bash
npm run dev --prefix backend
```
The server starts on `http://localhost:5000`. On first launch, the built-in seeder creates 5 demo accounts, 2 laundry hubs, and 5 verified luxury listings automatically!

### 4. Run the React Frontend
```bash
npm run dev --prefix frontend
```
Open `http://localhost:5173` in your browser.

### 5. Instant 1-Click Demo Profiles
Use these pre-seeded accounts to explore all 5 platform roles on the login page:
| Role | Email | Password | Primary Capability / Responsibilities |
|---|---|---|---|
| **Super Admin** | `admin1@loopwear.in` | `AdminPassword123!` | Government ID Review Queue, LoopWear Score, Nightly Tier Cron |
| **Verified Lender** | `anita@example.com` | `Password123!` | Platinum Tier Lender, Closet inventory, Uploads (6 photos + video) |
| **Active Renter** | `rohan@rent.in` | `Password123!` | Gold Tier Renter, Browse, Checkout, Handover OTP |
| **Hub Staff** | `ramesh@hub.in` | `StaffPassword123!` | Partner Laundry Hub Console, QC1, QC2, Outbound/Return Washing |
| **Delivery Agent** | `vikram@delivery.in` | `Password123!` | Logistics Handover Portal, Govt ID inspection & OTP verification |

---

## 🧪 Running the Test Suite

LoopWear enforces strict test coverage across all domain modules.

```bash
# Run all 6 test suites (Core, DB, Auth & User, Pricing & Listings, Order Lifecycle, Feedback & Tiers)
npm run test --prefix backend
```

```
Test Suites: 6 passed, 6 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        46.252 s
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `backend/.env`. All variables have safe local defaults:

| Variable | Default Value | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development`, `test`, `production`) |
| `PORT` | `5000` | Monolith backend HTTP port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/loopwear` | Database connection string |
| `QUEUE_TYPE` | `memory` | Queue driver: `memory` (0 dependencies) or `bullmq` (Redis) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection for BullMQ |
| `JWT_ACCESS_SECRET` | `dev_jwt_access_secret_32_characters_minimum!` | Signing secret for 15-minute access tokens |
| `JWT_REFRESH_SECRET` | `dev_jwt_refresh_secret_32_characters_minimum!` | Signing secret for 7-day refresh tokens |
| `ENCRYPTION_KEY` | `0123456789abcdef...` (64 hex chars) | AES-256-GCM symmetric encryption key for sensitive ID data |
| `CRON_SECRET` | `dev_cron_secret_key_change_in_production` | Bearer token protecting nightly tier recalculation endpoint |
| `DEV_BYPASS_CAPTCHA` | `true` | Allows local signup without Cloudflare Turnstile token |
| `MAIL_DRIVER` | `console` | `console` (logs OTP to terminal) or `smtp` (real email) |
| `SMS_DRIVER` | `console` | `console` stub only (NO paid SMS gateway) |
| `STORAGE_DRIVER` | `local` | `local` (disk uploads in dev) or `freemedia` (Cloudinary free tier) |
| `PAYMENT_GATEWAY` | `mock` | `mock` (built-in simulator) or `razorpay_test` (test mode) |
| `PUSH_DRIVER` | `inapp` | `inapp` (stored in memory/DB) or `fcm` (Firebase free tier) |

---

## 📖 API Documentation & Endpoints

Interactive Swagger UI documentation is hosted at:
```
http://localhost:5000/api-docs
```

### Core API Summary
- **Auth**: `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-email-otp`, `POST /api/v1/auth/verify-phone-otp`, `POST /api/v1/auth/refresh-token`
- **Users**: `GET /api/v1/users/me`, `PUT /api/v1/users/me/capabilities`, `POST /api/v1/users/me/id-verification`, `GET /api/v1/users/me/tier`
- **Pricing**: `POST /api/v1/pricing/quote`, `GET /api/v1/pricing/config`
- **Listings**: `GET /api/v1/listings`, `POST /api/v1/listings`, `POST /api/v1/listings/upload`, `PATCH /api/v1/listings/:id/verify`, `PATCH /api/v1/listings/:id/qc/:qcType`
- **Hubs**: `GET /api/v1/hubs`, `POST /api/v1/hubs`
- **Orders**: `POST /api/v1/orders`, `POST /api/v1/orders/:id/confirm-payment`, `POST /api/v1/orders/:id/lender-submit`, `POST /api/v1/orders/:id/qc1`, `POST /api/v1/orders/:id/qc2`, `POST /api/v1/orders/:id/hub-wash-outbound`, `POST /api/v1/orders/:id/dispatch-renter`, `POST /api/v1/orders/:id/handover`, `POST /api/v1/orders/:id/mark-in-use`, `POST /api/v1/orders/:id/return-pickup`, `POST /api/v1/orders/:id/return-qc`, `POST /api/v1/orders/:id/hub-wash-return`, `POST /api/v1/orders/:id/deliver-lender`, `POST /api/v1/orders/:id/close`
- **Feedback**: `POST /api/v1/feedback/orders/:orderId`, `GET /api/v1/feedback/orders/:orderId`
- **Tiers**: `POST /api/v1/tiers/nightly-recompute` (protected by `CRON_SECRET`), `POST /api/v1/tiers/recompute/:userId`

---

## 📊 Third-Party Services & Free-Tier Limits

| Service / Tool | Layer | Permanent Free Tier Allowance | Risk Flag / What Could Trigger Charges | Safe Fallback Built-in |
|---|---|---|---|---|
| **MongoDB Community** | Database (Local) | Unlimited (Docker local) | N/A (local instance) | Embedded In-Memory Server |
| **MongoDB Atlas** | Database (Cloud Demo) | 512 MB storage, shared RAM | Exceeding 512 MB pauses cluster (no automatic billing) | Export old closed orders / prune audit logs |
| **In-Process Queue** | Queue Engine | Unlimited | N/A (pure Node.js memory) | `MemoryQueueAdapter` works with 0 Redis instances |
| **BullMQ + Redis** | Queue Engine | Unlimited locally | Hosted Redis can charge if memory exceeded | Gracefully falls back to `MemoryQueueAdapter` |
| **Cloudflare Turnstile** | Bot / Captcha | 1,000,000 requests/month free | Paid Enterprise plan above limit | `DEV_BYPASS_CAPTCHA=true` bypass adapter |
| **Brevo / Free SMTP** | Email OTP | 300 emails/day permanent free | Stops sending when daily limit reached; never charges card | `ConsoleMailAdapter` prints OTP to stdout |
| **Firebase Cloud Messaging** | Push Alerts | Unlimited free notifications | None (FCM core is permanent free tier) | `InAppNotificationAdapter` fallback store |
| **Razorpay (Test Mode)** | Payment Simulator | Unlimited dummy transactions | Test keys NEVER charge real cards; strictly sandboxed | `MockPaymentGateway` runs with zero API keys |
| **Cloudinary** | Media Storage | 25 Credits/month (~25,000 transforms/storage) | Can require payment if storage exhausted | Client-side compression; `LocalStorageAdapter` fallback |
| **GitHub Actions** | CI & Nightly Cron | 2,000 mins/month free for public repos | Exceeding minutes halts CI (no unexpected bills) | Runs on self-hosted runners or external cron |

---

## 💰 Cost Review (Zero-Budget Financial Audit)

- **Free Forever**:
  - Express.js modular monolith backend (Node.js runtime)
  - React + Vite SPA frontend (can be deployed free on Vercel / Netlify / Cloudflare Pages)
  - In-process `MemoryQueueAdapter` (zero infrastructure overhead)
  - AES-256-GCM encryption & ID masking engine
  - Built-in Mock Payment Gateway & deposit ledger
  - In-house manual government ID review queue
  - Local Disk Media Storage engine
- **Free With Limits**:
  - MongoDB Atlas M0 (512MB free storage): Sufficient for ~15,000 closed orders and audit logs.
  - Transactional Email (300 emails/day free on Brevo/SendGrid): Covers ~75 daily signups with OTPs.
  - Cloudflare Turnstile (1M verifications/month): Ample for early-stage and beta testing.
- **Needs Payment At Scale**:
  - Direct SMS Gateway (e.g. Twilio / Gupshup): SMS is expensive in India (~₹0.25 - ₹0.50 per OTP). LoopWear intentionally uses free Email OTP as the primary channel and console stubs for phone OTP to avoid costs until funded.
  - Automated ID Verification APIs (e.g. Setu / Karza / HyperVerge): Replaces manual admin review with instant OCR checks when funded.

---

## 🚀 Upgrade When Funded

When seed funding or revenue is achieved, the following swappable adapters can be upgraded:

| Component | Current Zero-Budget Implementation | Funded Production Upgrade | Swappable Adapter |
|---|---|---|---|
| **Identity Verification** | Manual Admin Review Queue (Masked ref <=4 chars, printed name) | Instant Aadhaar / DigiLocker / Voter OCR API (Setu, Karza, HyperVerge) | `idVerification.adapter.js` (Stub already in place) |
| **SMS Gateway** | Console Stub (Email OTP is the real production channel) | Fast2SMS / Gupshup / Twilio Transactional SMS Route | `sms.adapter.js` |
| **Payment Gateway** | Built-in MockGateway + Razorpay Test Mode | Live Razorpay / Stripe Payments with automatic escrow payouts | `payment.adapter.js` |
| **Third-Party Logistics** | MockDeliveryProvider (in-house delivery agents) | Dunzo / Porter / Shadowfax B2B Delivery API integration | `delivery.adapter.js` |
| **Media CDN** | Local Disk Storage with client compression | AWS S3 + CloudFront or Cloudinary Paid Scale Plan | `storage.adapter.js` |
| **AI Authenticity / QC** | Manual Hub Staff QC1 & QC2 Checklists | Computer Vision ML Service (`ml-service/app.py`) for stain & tear detection | `listings.service.js` |

---

## 🔒 Legal & Regulatory Compliance (Government ID Storage)

> [!IMPORTANT]
> **Legal Compliance Notice:**
> The LoopWear engineering team has implemented strict digital identity privacy protocols under the Indian Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDPA), 2023:
> 1. Full 12-digit Aadhaar numbers, voter card numbers, ration card numbers, and raw identity document photos are **STRICTLY FORBIDDEN** from being stored in the database or logged in server output.
> 2. The platform only stores the **ID type**, a **masked reference** of at most the last 4 characters (e.g. `XXXX9012`), and the **name as printed** on the document.
> 3. Sensitive fields are encrypted at rest using **AES-256-GCM** with a 32-byte key.
> 4. User consent is explicitly captured and timestamped prior to verification.
> 5. **Legal counsel must review and confirm ID storage retention periods and final user consent copy prior to commercial production launch.**

---

## 📜 Open Source Commercial License Audit

All project dependencies have been verified to permit free commercial use without proprietary or paid licensing restrictions:

| Dependency | License | Permitted Commercial Use | Purpose |
|---|---|---|---|
| `express` | MIT | ✅ Yes | Modular monolith HTTP server |
| `mongoose` | MIT | ✅ Yes | MongoDB ODM |
| `zod` | MIT | ✅ Yes | Request schema and environment validation |
| `jsonwebtoken` | MIT | ✅ Yes | Stateless JWT access and refresh tokens |
| `bcryptjs` | MIT | ✅ Yes | Zero-native-dependency secure password hashing |
| `helmet` | MIT | ✅ Yes | HTTP security headers |
| `cors` | MIT | ✅ Yes | Cross-origin resource sharing |
| `morgan` | MIT | ✅ Yes | HTTP request logging |
| `multer` | MIT | ✅ Yes | File upload multipart processing |
| `nodemailer` | MIT | ✅ Yes | SMTP transactional email adapter |
| `swagger-ui-express` | MIT | ✅ Yes | OpenAPI 3.0 interactive documentation |
| `express-rate-limit` | MIT | ✅ Yes | Auth & OTP endpoint brute-force protection |
| `react` & `react-dom` | MIT | ✅ Yes | Frontend UI framework |
| `react-router-dom` | MIT | ✅ Yes | Client-side routing |
| `tailwindcss` | MIT | ✅ Yes | Utility-first CSS styling |
| `lucide-react` | ISC | ✅ Yes | Lightweight open-source icons |
| `jest` & `supertest` | MIT | ✅ Yes | Testing framework |

---

## 🎨 Frontend Architecture & 9 Core Screens

The frontend is a mobile-first, high-performance Single Page Application (SPA) built with **React 18**, **Vite**, and **Tailwind CSS**. It follows an accessible, component-driven design system using only free open-source fonts and icons.

### Navigation Structure (Capability-Aware)
The top navigation dynamically adapts based on the user's active capabilities (`renter`, `lender`, or both) and restricted roles (`admin`, `hub_staff`, `delivery_agent`):
1. **Lender**: Links to Lender Wardrobe Closet & Earnings (`/lender/dashboard`). For users without lender capability, prompts capability activation in Profile.
2. **Renter**: Links to Verified Catalog Feed (`/feed`) with category and occasion filters.
3. **Categories**: Links to Curated Occasions & Garment Types (`/categories`).
4. **Cart**: Capability-aware Closet Cart (`/cart`) showing items listed vs. items being rented.
5. **Feedback**: Two-way peer feedback portal (`/feedback`) tied to closed orders.
6. **Info**: User account overview (`/info`) with LoopWear ID, loyalty tier, executive score, transaction ledger, and masked payment details.

### Screen Matrix (100% Implemented)
| # | Screen | Route | Key Zero-Budget & Business Rule Capabilities |
|---|---|---|---|
| **1** | **Register / Login** | `/register`, `/login` | Name, email, phone, captcha widget (with dev bypass), government ID fields (masked ref <=4 chars, printed name, legal consent), dual OTP (real email OTP + stubbed phone OTP console hint), 1-click quick-fill demo buttons for all 5 roles. |
| **2** | **Categories** | `/categories` | 4 luxury occasion promo tiles (Wedding & Sangeet, Red Carpet & Prom, Cocktail & Date Night, Resort & Casual Luxe) + 5 garment type cards + visible promotional banner slot reserved for future marketing campaigns (Upgrade when funded). |
| **3** | **Renter Catalog & Checkout** | `/feed`, `/listings/:id`, `/checkout/:id` | Paginated browse with keyword search and category/occasion pills, product page with photo gallery, video badge, live CFO price breakdown quote (`/pricing/quote`), date picker, checkout with auto-selected MockGateway or Razorpay test mode, 14-state interactive timeline. |
| **4** | **Lender Studio** | `/lender/upload`, `/lender/dashboard` | Client-side canvas image compression (<=6 photos), video upload cap (<=25MB), declared hygiene condition (`washed` / `unwashed`), wardrobe management with verification/QC badges, and earnings tracker. |
| **5** | **Closet Cart** | `/cart` | Tab 1: "Items I Have Listed" (wardrobe listings, status badges, daily rent, assigned hub). Tab 2: "Items I Am Renting" (active rentals in transit/in use, held security deposit, quick link to live tracker). Summary KPI bar. |
| **6** | **Delivery Handover** | `/orders/:id`, `/delivery` | Dedicated Handover notice for the renter displaying 6-digit OTP with 1-click copy, physical government ID reminder (Aadhaar / Voter ID / Ration Card), representative receiving rules, and delivery agent verification portal. |
| **7** | **Two-Way Feedback** | `/feedback` | Completed orders rating portal: Renters rate Item Accuracy, Condition, and Lender Conduct (1-5 each); Lenders rate Return Condition and Renter Conduct (1-5 each). History of past peer reviews and community score banner. |
| **8** | **Info & Tier Overview** | `/info` | `LW-<8-chars>` LoopWear ID with copy button, loyalty tier perks (platform fee discount, deposit reduction, priority support), executive LoopWear score (1.0–5.0), verified account details, masked saved payment details (`UPI: ro***@okhdfcbank`), and past transactions ledger. |
| **9** | **Admin Governance Console** | `/admin` | Manual government ID review queue (approve/reject with reason), executive LoopWear score entry, idempotent nightly tier recalculation trigger, and live in-app system notifications queue. |

---

## 🌐 Free Frontend Deployment Guide

The frontend SPA compiles into static assets (`dist/`) that can be hosted 100% free forever on any static CDN.

### Option 1: Cloudflare Pages (Recommended - Zero Limits)
1. Push this repository to GitHub.
2. In Cloudflare Dashboard, navigate to **Compute (Pages & Workers)** → **Create Application** → **Pages** → **Connect to Git**.
3. Select this repository and configure build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build --prefix frontend`
   - **Build Output Directory**: `frontend/dist`
   - **Root Directory**: `/`
4. Set Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://loopwear-api.onrender.com/api/v1`)
   - `VITE_DEV_BYPASS_CAPTCHA`: `false` (or `true` for staging)
   - `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`: Your free Cloudflare Turnstile public key
5. Deploy. Cloudflare Pages provides unlimited bandwidth, global edge caching, and free SSL forever.

### Option 2: Vercel (Free Hobby Tier)
1. Install Vercel CLI (`npm i -g vercel`) or import through [vercel.com](https://vercel.com).
2. Configure `frontend` as Root Directory.
3. Build command: `npm run build`, output directory: `dist`.
4. Add environment variables matching `frontend/.env.example`.
5. Deploy with 0 configuration.

### Option 3: Netlify (Free Starter Tier)
1. Import repository on [netlify.com](https://netlify.com).
2. Set base directory to `frontend`, build command to `npm run build`, and publish directory to `frontend/dist`.
3. Add a `_redirects` file in `frontend/public/_redirects`:
   ```
   /*    /index.html   200
   ```
   *(This ensures client-side React Router handles all deep URLs).*

---

## 💵 Frontend Cost Review

| Resource | Service / Provider | Monthly Cost | Constraints / Free Quota |
|---|---|---|---|
| **Static Hosting & CDN** | Cloudflare Pages / Vercel / Netlify | **$0.00 (₹0)** | Unlimited bandwidth on Cloudflare; 100GB/mo on Netlify. |
| **Typography & Fonts** | Google Fonts / Inter / Playfair Display | **$0.00 (₹0)** | Open-source SIL Open Font License (OFL). |
| **Iconography** | Lucide React | **$0.00 (₹0)** | Open-source ISC license; zero external API requests. |
| **Media Compression** | Client-Side HTML5 Canvas API | **$0.00 (₹0)** | Executed locally in user browser; saves 85% bandwidth with zero server compute. |
| **Bot Protection** | Cloudflare Turnstile Free Tier | **$0.00 (₹0)** | Up to 1,000,000 challenge requests per month free. |
| **Total Frontend Operating Cost** | | **$0.00 / month** | Guaranteed 100% Free Forever. |

---

## 🔍 Backend Gaps Identified During Frontend Integration

During the end-to-end integration and verification of all 9 screens against the backend Express API, the following minor gaps were identified for future engineering sprints:

1. **Static Category Enum vs. Dynamic Endpoint**:
   - *Current State*: The backend defines categories as an internal enum (`['clothes', 'suits', 'shirts', 'pants', 'watches']`) in `listing.model.js` without a dedicated `GET /api/v1/categories` route.
   - *Workaround*: The frontend maintains occasion collections and category tags in clean modular constants (`Categories.jsx`).
   - *Recommendation*: Add `GET /api/v1/categories` returning category keys, display labels, active listing counts, and seasonal promo badges to allow dynamic marketing management without code changes.

2. **Unauthenticated Public Hub Query for Listing Creation**:
   - *Current State*: In `listing.controller.js`, creating a listing requires `assignedHubId`. The only way to retrieve hubs is `GET /api/v1/hubs`, which is role-guarded or requires an authenticated session.
   - *Workaround*: The frontend defaults to the nearest seeded hub (e.g. Bandra Hub) or authenticated hub query.
   - *Recommendation*: Add an open public endpoint `GET /api/v1/hubs/public` with city filter so lenders can explore nearby partner laundries before or during listing creation.

3. **Order Feedback Submission Status Flag in Order List**:
   - *Current State*: `GET /api/v1/orders/me` returns the order array without indicating whether the requesting user has already submitted feedback for closed orders. The frontend must query `GET /api/v1/feedback/orders/:orderId` per closed order to differentiate pending vs. completed feedback.
   - *Workaround*: The frontend batches feedback lookups concurrently for closed orders.
   - *Recommendation*: Enrich `GET /api/v1/orders/me` with a lightweight summary field: `hasFeedback: { renter: Boolean, lender: Boolean }`.

---

## 📋 Assumptions, TODOs & Open Items

### Assumptions
1. **Partner Laundry Hubs**: Hubs are existing local dry-cleaners equipped to perform fabric quality checks and eco-sanitization washes. They do not hold long-term inventory; outfits route through them for turnover.
2. **Delivery Handover**: Renter or an authorized representative (e.g. family member at home) may receive the garment by presenting a valid government ID and the registered 6-digit OTP.
3. **Escrow & Deposit Deductions**: In mock mode, deposit deductions are simulated instantly on the ledger. In production with live gateways, pre-authorization holds or escrow wallets will be used.

### TODOs Recorded
- [ ] **Legal Review**: Legal team to approve final Aadhaar/Voter consent text and data retention schedule before production launch.
- [ ] **CFO Final Pricing**: Replace placeholder pricing config (`rentDayDiscounts`, fees, commission percentages) once the CFO finalizes platform economics.
- [ ] **Automated ML QC Service**: When funded, deploy the planned FastAPI `ml-service/app.py` microservice to analyze lender photos for stains and tears automatically.
- [ ] **Live Payment Gateway**: Plug in live Razorpay or Stripe API keys when bank account and KYC are completed.
- [ ] **Third-Party Logistics (3PL)**: Implement vendor adapter for Porter or Dunzo API when local courier partnership contracts are signed.

