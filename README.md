# CoolCredit — Refrigerant Recovery Incentive & Custody Platform

**CoolCredit** is a technician-centred web and mobile platform built for **Quantro Software Labs** to support Nigeria's phase-down commitments under the Montreal Protocol and the Kigali Amendment.

The platform provides a direct financial incentive (configurable pilot rate: **₦4,500 per kg**) and an append-only chain-of-custody tracking system for refrigeration and air-conditioning (RAC) technicians in **Lokoja, Kogi State, Nigeria**. It eliminates refrigerant venting by paying technicians to recover used gas and tracking every cylinder through calibrated weighing, gas identification, downstream reclamation, or approved destruction.

---

## 1. Honest Project Status & Disclaimers

In adherence to Section 3 and Section 4 of the project specifications, **no claims are overstated or fabricated**:
- **Pilot Location:** Lokoja, Kogi State, Nigeria. Target: At least 30 technicians recovering at least 300 kg over a 6-month operational window.
- **Regulatory Status:** The project proposal was submitted to the National Ozone Office (NOO) on 27 October 2026. **It is not approved.** No government permit, endorsement, or support letter exists yet.
- **Legal Entity:** Quantro Software Labs' CAC business registration is currently in progress.
- **Incentive Rate:** The ₦4,500 / kg rate shown on project collateral is a **configurable pilot rate**, paid strictly after physical verification at the collection point.
- **Downstream Pathways:** Destruction (e.g. high-temperature cement kiln co-processing) and reclamation facilities are unconfirmed and subject to NOO guidance.
- **Carbon Credits:** Upside only. Major carbon standards have not generally accredited Nigerian domestic HFC destruction projects; no feature or payout depends on carbon credit revenue.

---

## 2. Non-Negotiable System Principles

1. **No Fabrications:** Every number displayed comes from a database record or stated formula. No fake "transfer successful" dialogs, partner endorsements, or simulated carbon credits.
2. **Pay Only for Verified Quantities:** Payments are generated only when an authorized operator weighs the cylinder on a calibrated scale and confirms gas type using a refrigerant identifier.
3. **Integer Precision for Weight & Money:**
   - Money is strictly stored as **integer kobo** (100 kobo = ₦1.00).
   - Weight is strictly stored as **integer grams** (1,000 grams = 1.00 kg).
   - Never stored as floating-point numbers.
   - Payout formula: `round(grams * rateKobo / 1000)`.
4. **Append-Only Custody:** All custody transitions are recorded as immutable events (`RECOVERED`, `VERIFIED`, `REJECTED`, `PAID`, `RECLAIMED`, `DESTROYED`). Events are never modified or deleted.
5. **Real Bank References Required:** Payouts cannot be marked "paid" without entering an authentic bank transfer reference (e.g. NIP session ID).
6. **Server-Enforced Access Control:** Every API route enforces role-based permissions (`technician`, `operator`, `admin`, `regulator`, `funder`) on the server.
7. **Offline-First Resilience:** Technicians can log recoveries without internet connectivity. Records are saved locally with an idempotency key and synced automatically once signal returns.

---

## 3. User Roles & Demo Credentials

The authentication demo accounts below are created or refreshed by `npm run seed`:

| Role | Name | Email | Password | Access Rights |
|---|---|---|---|---|
| **RAC Technician (Certified)** | Musa Ibrahim | `tech1@coolcredit.ng` | `TechPass123!` | Self-register, log recoveries online/offline, view cylinders & payouts, download receipts |
| **RAC Technician (Pending)** | Emeka Okafor | `tech2@coolcredit.ng` | `TechPass123!` | Registered; blocked from logging gas until NARAP training is approved by Admin |
| **Collection Point Operator** | Fatima Bello | `operator@coolcredit.ng` | `OperatorPass123!` | Intake queue, calibrated weighing, gas identifier purity test, verify & pay, reject |
| **Programme Admin** | Dr. Aliyu Mohammed | `admin@coolcredit.ng` | `AdminPass123!` | Manage payouts, mark paid with bank ref, dispatch batches, readiness matrix, unit economics, certify technicians |
| **Regulator (NOO / NESREA)** | Ozone Officer | `regulator@noo.gov.ng` | `RegulatorPass123!` | Read-only view of aggregated and cylinder records, monthly reports, audit log |
| **Funder / Partner** | Multilateral Fund | `funder@greenclimate.org` | `FunderPass123!` | Read-only aggregate program metrics only (PII stripped) |

---

## 4. Setup & Running the Application

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas cluster and database user with read/write access to `coolcredit`

### Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create `.env.local` in the project root. For Atlas, set `MONGODB_URI` to the connection string from Atlas and keep `MONGODB_DB_NAME=coolcredit`:
   ```env
   MONGODB_URI=mongodb+srv://<database-user>:<password>@<cluster-host>/?retryWrites=true&w=majority
   MONGODB_DB_NAME=coolcredit
   JWT_SECRET=<generate-a-random-secret-at-least-32-characters-long>
   DEFAULT_PAYOUT_RATE_KOBO=450000
   VARIANCE_THRESHOLD_PCT=20
   NEXT_PUBLIC_APP_URL=https://your-public-app-domain
   ```
   Replace the JWT placeholder with a unique random secret; do not use the placeholder literally. In Atlas, grant the database user read/write access to `coolcredit` and allow your app's server IP in Network Access. Keep the actual URI and credentials only in `.env.local` or your deployment's secret settings; URL-encode special characters in the username or password.
   The application and all database scripts require an Atlas `mongodb+srv://` URI. There is no local MongoDB fallback. Atlas hosts the database, not the Next.js web application, so deploy the Next.js app to a web host and set `NEXT_PUBLIC_APP_URL` to that hosted app's public URL. Use a localhost URL only when intentionally running the web app locally during development; production QR codes reject localhost URLs.

3. **Seed the four authentication accounts:**
   ```bash
   npm run seed
   ```
   This command requires a valid Atlas `MONGODB_URI`, connects to the `coolcredit` database, and upserts the six listed accounts with bcrypt password hashes. It verifies every account's password hash and role, without deleting users or other collections. Set the same `MONGODB_URI`, `MONGODB_DB_NAME=coolcredit`, and a persistent `JWT_SECRET` in your hosting provider before deploying. Never paste the Atlas URI into chat or commit it.

   The former full demo-data seed script is destructive and is disabled by default. Do not enable it against production; it is not needed to create or repair these login accounts.

4. **Run the Automated Test Suite:**
   ```bash
   npm test
   ```
   *Runs 18 unit and integration tests verifying integer payout math, emissions formula, guarded MongoDB state transitions, and server-side role enforcement.*

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Mobile & Responsive UX Design System

- **Measured Poster Palette:**
  - Base Navy: `#010E2A`
  - Green Fill & Buttons: `#22B974` (with `#010E2A` text, 7.5:1 contrast)
  - Bright Green Text (on navy): `#2ECD8A` (9.3:1 contrast)
  - Dark Green Text & Links (on light): `#16794C` (5.4:1 contrast on white)
  - Light Surface: `#F4F4F6`
  - Mint Accent: `#D1EBE0`
  - Inactive Tab Grey: `#A9B2C3` (8.97:1 contrast)
- **Mobile First (<768px):** Fixed bottom tab bar (height 56px + safe-area padding), minimum 44px touch targets, labels always visible, visual indicator on active tab, hides automatically when virtual keyboard opens.
- **Desktop (≥768px):** Replaced by a fixed left sidebar with branding, role indicators, and quick demo role switchers.
- **Multi-Language Dictionary:** English (`en`), Hausa (`ha`), Yorùbá (`yo`), Igbo (`ig`), and Nigerian Pidgin (`pcm`).

---

## 6. Pilot Decision Matrix & Unit-Economics

- **Readiness Matrix (`/admin/readiness`):** 5 hard stops (legal CAC registration, written regulatory position, written destination routes, committed funds, compliant storage/insurance). Any open hard stop enforces a **HOLD**. Weighted scoring across 7 categories determines **Go** (80+), **Adjust** (60–79), or **Hold** (<60).
- **Unit-Economics Calculator (`/admin/calculator`):** Interactive model analyzing net program cost per kg, technician viability test (ensuring payment > recovery labor & transport), avoided emissions cost per tonne CO₂e, and 300 kg budget need.
- **Monthly NOO Report (`/reports`):** Quantity by refrigerant type, emissions avoided formula (`kg × GWP ÷ 1000 = tCO2e`), reconciliation summary, printable PDF view, and CSV export.

---

## 7. What Was Tested vs Honest Limits

### Tested & Verified:
- MongoDB connection, collection indexing (`email`, `code`, `recId`).
- Payout integer calculations and zero-float rounding logic.
- Guarded state machine: `recovered` -> `verified` -> `reclaimed`/`destroyed`; `recovered` -> `rejected`. Double-verification and invalid state skips were verified to fail safely.
- Server-side role checks returning HTTP 401/403.
- Offline queue sync with idempotency keys.
- Next.js production build (`npm run build`) completed with 0 errors.

### What Could Not Be Tested:
- **Real Bank Disbursement:** Simulated using manual reference input; no live NIP/Interswitch/Paystack API was connected (pending legal entity and corporate bank account).
- **Physical Scale Hardware Integration:** Weighed amounts are entered manually by the operator; no RS-232 serial cable driver was tested in this software layer.
- **Live SMS/WhatsApp Webhooks:** Phase 2 channels; not connected in pilot software.
