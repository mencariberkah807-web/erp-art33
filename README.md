# ARTKRILIK ERP V3 — Master Build Plan

## Purpose

ARTKRILIK ERP V3 is a full-stack ERP rebuild with React frontend, REST API, backend domain/services, repositories, and PostgreSQL. The V3 business baseline is the Single Source of Truth (SSOT). Legacy code is protected behavior reference only.

## Locked principles

- React owns presentation.
- Backend owns API, application services, domain behavior, and persistence orchestration.
- PostgreSQL is the target relational source of truth.
- Legacy JS is reference material for validated behavior only.
- No hard delete for business records; cancellation means `INACTIVE`.
- Existing validated behavior must not be silently changed.
- New locked V3 requirements take precedence over legacy implementation.
- Primary CTA uses a light/brighter blue; ARTKRILIK navy remains structural/brand; red is destructive/accent, not the default Save/Create/Update/Submit CTA.

## Change control

Every implementation task follows:

```text
SCAN → IDENTIFY → PROPOSE → APPROVE → APPLY → VALIDATE
```

No code change is applied before the relevant proposal is explicitly approved.

## AI build workflow

```text
USER REQUEST
↓
AI SCAN
↓
AI IDENTIFY
↓
AI PROPOSE
↓
USER APPROVES
↓
AI BUILDS / CODES
↓
AI VALIDATES
↓
GITHUB
↓
USER: git pull
↓
RUN / TEST
```

The user should not manually write or patch source code unless explicitly requested.

## Git safety

Never force-push, reset/revert unrelated work, delete unrelated files, overwrite user work, silently migrate data, or silently alter business rules. Understand local/remote differences before synchronization.

## Build phases

```text
00 Core / Foundation
01 PostgreSQL foundation
02 Customer
03 Product
04 Sales Order
05 Payment
06 SO ↔ Payment
07 Work Order
08 Production
09 RTS / Handover
10 Packing / Delivery
11 Full End-to-End
12 Marketplace vertical slice
13 Edge / regression
14 UI/UX polish
15 Final validation
```

### Phase 00 — Repository / full-stack foundation

Repository structure, frontend shell, backend shell, database foundation, environment configuration, development scripts, API foundation, and health check.

### Phase 01 — PostgreSQL foundation

Core schema, IDs, timestamps, status conventions, migration strategy, and seed strategy.

### Phase 02 — Customer

SQL, backend repository/service/API, React pages/components, validation, and CRUD behavior.

### Phase 03 — Product

SQL, backend repository/service/API, React pages/components, validation, and CRUD behavior.

### Phase 04 — Sales Order

Direct Order, Marketplace, order items, calculations, artwork, production notes, SO Detail, and status rules.

### Phase 05 — Payment

Payment history, balance, payment status, validation, and Marketplace automatic PAID behavior.

### Phase 06 — SO ↔ Payment

Transaction consistency, recalculation, history, and status synchronization.

### Phase 07 — Work Order

One active SO Item → one WO, inherited transaction data, relationship, cancellation boundary, and edit synchronization before production.

### Phase 08 — Production

Production processes, execution status, production boundary, and no sequential-stage engine unless explicitly approved.

### Phase 09 — RTS / Handover

Production completion, RTS gate, Admin handover, and payment gate.

### Phase 10 — Packing & Delivery

SO-based packing lookup, active item aggregation, pack gate, and delivery/handover state.

### Phase 11 — Full End-to-End

```text
Customer → Product → Sales Order → Payment → Work Order → Production → RTS → Handover → Packing / Delivery → Completed
```

## V3 locked Sales Order / Work Order baseline

Core flow:

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

One active Sales Order Item produces one Work Order. Quantity does not create additional WOs. Relationship identity is `SO Number + SO Item ID → WO`.

Direct Order:

```text
New Order → Direct Order → Order Form → Create Order → SO Detail → Create WO
```

Marketplace:

```text
New Order → Marketplace → Create WO → Automatic Payment = PAID → WO pathway
```

`COMPLETED PRODUCTION` is a Work Order status, not the main Sales Order status.

## Status baseline

Sales Order:

```text
NEW ORDER
READY PRODUCTION
IN PRODUCTION
PACKING
RTS
COMPLETED
INACTIVE
```

Work Order production:

```text
READY PRODUCTION
IN PRODUCTION
COMPLETED PRODUCTION
```

Cancellation:

```text
CANCEL = INACTIVE
DELETE = PROHIBITED
```

Cancellation is not allowed after the related WO enters production.

## Legacy boundary

Legacy behavior must never be treated as V3 architecture. For example, a legacy work order transition from `COMPLETED PRODUCTION → PACKING` must not override the V3 flow through RTS and handover.

## Definition of done

A phase is complete only when actual repository files were scanned, scope identified, proposal approved, implementation applied, SQL/API/frontend integration validated, relevant tests passed, no unrelated files changed, Git state understood, and the result is ready for the user's GitHub pull workflow.
