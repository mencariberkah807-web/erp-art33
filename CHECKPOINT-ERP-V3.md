# ARTKRILIK ERP V3 — CURRENT CHECKPOINT

**Date:** 2026-09-19
**Repository:** `mencariberkah807-web/erp-art33`
**Purpose:** Working SSOT checkpoint for the current implemented vertical slice.

## 1. CURRENT WORKING SLICE

```text
CUSTOMER
   ↓
PRODUCT
   ↓
SALES ORDER
   ↓
PAYMENT
   ↓
WORK ORDER
   ↓
PRODUCTION
```

The above slice is the current implementation checkpoint. It is not a claim that the entire ERP is complete.

## 2. SALES ORDER — WORKING

- Direct Order creation persists successfully.
- Sales Orders appear in the Sales Orders list.
- Sales Order View is a read-only recheck page.
- View actions are limited to actions permitted by the current order state.
- View does not expose Add Payment.
- Payment editing/addition is performed through Edit Sales Order.
- Order Date and Deadline display as `DD/MM/YYYY`.
- Edit Sales Order pre-fills the existing Order Date and Deadline.
- Existing order data does not need to be re-entered simply to update another field.

## 3. PAYMENT — WORKING

- Direct Order supports payment history.
- Total Paid is calculated from payment records.
- Balance is Grand Total minus Total Paid.
- Payment cannot exceed the remaining balance.
- Multiple payment records are preserved as history.
- Payment transaction handling reuses the active transaction client correctly.
- Marketplace payment is automatically PAID according to the V3 baseline.

## 4. WORK ORDER — WORKING

Relationship:

```text
1 Active SO Item
       ↓
1 Work Order
```

Quantity does not multiply Work Order count.

Work Order list loads correctly.

Work Order View is a full detail-page pattern consistent with Sales Order View:

```text
Back
Start Production / Complete Production (state-dependent)
Print
```

WO detail contains execution information, material/specification, artwork, production notes, and production timeline.

WO dates display as `DD/MM/YYYY`.

## 5. PRODUCTION — WORKING UI

Production Board is an operational board, not a sequential stage wizard.

Columns:

```text
Ready Production
In Production
Completed Production
```

Current production process concepts:

```text
Laser Cutting
UV Printing
Assembly
Laser Marking
Finishing
```

Production processes are non-sequential and may occur in different order or in parallel.

Actions currently wired:

```text
Ready Production → Start Production
In Production   → Complete Production
```

Do not introduce a mandatory `Next Production Stage` engine.

## 6. V3 BUSINESS FLOW — LOCKED TARGET

```text
NEW ORDER
   ↓
READY PRODUCTION
   ↓ START
IN PRODUCTION
   ↓ DONE
COMPLETED PRODUCTION
   ↓
PACKING
   ↓ PACK
RTS
   ↓
HANDOVER
   ↓
COMPLETED ORDER
```

Production completion and Order completion are different responsibilities.

```text
COMPLETED PRODUCTION ≠ COMPLETED ORDER
```

Production completes the Work Order execution.

Admin completes the Sales Order after the required downstream gates.

## 7. RTS / HANDOVER / PACKING — NEXT SCOPE

Target flow:

```text
COMPLETED PRODUCTION
        ↓
RTS
        ↓
CUSTOMER / COURIER
        ↓
HANDOVER
        ↓
PAYMENT = PAID
        ↓
COMPLETED ORDER
```

Packing is an operational step around RTS/delivery.

Packing lookup is based on Sales Order and must consider all Active SO Items. Work Orders provide production status; they are not the primary packing lookup identity.

## 8. CANCELLATION

```text
CANCEL = INACTIVE
DELETE = PROHIBITED
```

Cancellation is allowed before production starts and rejected after production starts.

Partial cancellation is performed by making the affected SO Item inactive and the related WO inactive where applicable.

## 9. MULTI-WO AGGREGATION

For a Sales Order containing multiple active items:

```text
SO
├── WO A
├── WO B
└── WO C
```

SO production status is derived from active Work Orders.

Inactive Work Orders do not participate in production aggregation.

## 10. UI / UX RULES

- React owns presentation.
- View pages are read-only recheck surfaces.
- Edit pages contain editable transaction controls.
- Payment action belongs to Edit, not View.
- Dates shown to users use Indonesian `DD/MM/YYYY` formatting where date-only presentation is intended.
- Primary CTA uses light/brighter blue.
- ARTKRILIK navy `#1F3356` is structural/brand.
- Red `#ED1C24` is destructive/accent.
- Do not redesign a confirmed working page for unrelated cleanup.

## 11. CHANGE CONTROL

Every new implementation follows:

```text
SCAN
 ↓
IDENTIFY
 ↓
PROPOSE
 ↓
APPROVE
 ↓
APPLY
 ↓
VALIDATE
 ↓
CHECKPOINT
 ↓
GITHUB
 ↓
USER PULL
```

One approved scope at a time.

Do not use broad repeated scans as a substitute for implementation.

Do not refactor unrelated working code.

Do not change locked business behavior without explicit approval.


## 12. AUTHENTICATION FOUNDATION — IMPLEMENTED

Authentication has been added using a simple server-side PostgreSQL session model.

Implemented:
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- POST /api/v1/auth/logout
- PostgreSQL auth_sessions table via migration 018_auth_sessions.sql.
- Session token is stored hashed with SHA-256.
- Password verification uses Node crypto.scrypt.
- Inactive users are rejected.
- backend/scripts/create-admin.mjs creates an ACTIVE Admin user and assigns the ADMIN role.
- CORS credentials support is enabled.
- Dashboard API has been protected with requireAuth.

Current validation status:
- GitHub changes pulled successfully into Codespace at commit 502c145.
- .env exists and contains DATABASE_URL.
- Explicit dotenv loading confirms DATABASE_URL is available.
- npm run migrate currently stops because scripts/migrate.mjs reads process.env.DATABASE_URL before loading dotenv.
- No further auth validation has been performed yet.

## 13. AUTHORIZATION — NOT YET IMPLEMENTED

The remaining ERP route modules are not yet fully protected by requireAuth.
Role/permission enforcement is also not yet implemented.

Do not claim authentication or authorization validation is complete until the local migration, admin creation, login, /me, logout, and protected-route tests pass.

## 14. CURRENT NEXT ACTION

Fix only the migration environment loading issue in backend/scripts/migrate.mjs, then run migration and validate authentication locally.

Do not redesign authentication and do not introduce JWT.
