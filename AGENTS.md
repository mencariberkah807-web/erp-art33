# AGENTS.md — ARTKRILIK ERP V3

## Mission

You are the AI engineering agent for ARTKRILIK ERP V3.

Build the ERP from the repository state outward: frontend, backend, SQL/database, tests, and integration.

The V3 business design is the SSOT.

Legacy code is protected reference material for validated behavior only.

## Non-negotiable engineering rules

Every task follows:

```text
SCAN → IDENTIFY → PROPOSE → APPROVE → APPLY → VALIDATE
```

Never skip approval for implementation changes. Before approval, do not edit source, change schema, refactor, clean up unrelated code, redesign existing behavior, or change locked business behavior.

Work incrementally, one approved scope at a time. Always inspect the actual repository before making assumptions. Never invent files, functions, API endpoints, database columns, dependencies, business behavior, or test results.

## AI-first development

The user should primarily describe the goal, review the proposal, approve, pull from GitHub, run/test, and report results. The AI engineering workflow owns approved frontend, backend, SQL, repositories, services, controllers, routes, domain rules, validation, tests, documentation, and integration.

The user should not manually edit application source unless explicitly requested.

## Git safety

Never force-push, reset/revert unrelated work, delete unrelated files, overwrite user work, silently migrate data, or silently alter business rules. Understand Git state before synchronization. Do not create commits without authorization.

## Architecture

```text
React Frontend
      ↓
REST API
      ↓
Application Service + Domain Rules
      ↓
Repository
      ↓
PostgreSQL
```

React owns presentation. Business rules do not belong directly in React. PostgreSQL is the relational source of truth.

## Domain build order

```text
00 Core / Foundation
01 PostgreSQL
02 Customer
03 Product
04 Sales Order
05 Payment
06 SO ↔ Payment
07 Work Order
08 Production
09 RTS / Handover
10 Packing / Delivery
11 End-to-End
12 Marketplace
13 Regression
14 UI/UX
15 Final Validation
```

Do not jump ahead without an explicit dependency or approval.

## V3 business SSOT

### Sales Order

Only two order types: Direct Order and Marketplace.

Direct Order requires Master Customer.

Marketplace requires No. Resi and Marketplace; marketplace customer is optional text/customer name.

Each order has at least one item. Each active SO item maps to exactly one WO. Quantity does not multiply WO count.

### Payment

Direct Order supports Grand Total, Total Paid, Balance, Payment Status, and Payment History.

Statuses: UNPAID, PARTIALLY PAID, PAID.

Payment cannot exceed balance. Marketplace automatically receives PAYMENT = PAID.

Payment history must remain a history, not a single mutable amount field.

### Work Order

WO inherits required execution data from SO + SO Item.

Before production, SO edits synchronize to the related WO. After production starts, WO becomes execution authority.

Cancellation is allowed before production and rejected after production starts. Cancellation means INACTIVE. Hard delete is prohibited for business records.

Relationship identity: SO Number + SO Item ID → WO.

### Production

Production processes are not a forced sequential stage engine. Current concepts include Laser Cutting, UV Printing, Assembly, Laser Marking, and Finishing. They may occur in different order or in parallel. Do not invent a Next Production Stage engine.

### RTS / Handover / Packing

V3 flow:

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

## Legacy boundary

Legacy source is reference material, not V3 architecture, UI, or database design. Protected legacy examples may include customer.js, product.js, sales-orderv2.js, payment.js, and workorder.js.

If legacy behavior conflicts with a locked V3 requirement, the V3 locked requirement is authoritative. Report the conflict explicitly.

## Frontend rules

React owns presentation. Do not duplicate domain calculations across UI components.

Primary CTA uses a light/brighter blue. ARTKRILIK navy `#1F3356` remains structural/brand. Red `#ED1C24` is destructive/accent, not the default Save/Create/Update/Submit CTA.

## Current implementation checkpoint — 2026-09-16

The following behavior has been implemented in the current repository and confirmed working by the user during the current build cycle:

### Working

- Dashboard loads successfully after the dashboard aggregation/query fix.
- Direct Sales Order can be created and persisted.
- Sales Order list displays persisted orders.
- Sales Order View is a read-only recheck page.
- Sales Order View displays dates as `DD/MM/YYYY`, not raw ISO timestamps.
- Sales Order View does not expose Add Payment.
- Payment action belongs to Edit Sales Order, not View.
- Direct Order payment history supports multiple payment records and balance calculation.
- Payment transaction handling reuses the active transaction client correctly.
- Sales Order can create Work Orders.
- Work Order list loads successfully after the ambiguous `id` query issue was fixed.
- Work Order View uses a full detail-page pattern consistent with Sales Order View.
- Work Order detail dates use `DD/MM/YYYY`.
- Production Board loads and displays Work Orders by production status.
- Production Board supports Start Production and Complete Production using the existing Work Order lifecycle endpoints.
- Production processes remain non-sequential.

### Locked UI behavior

Sales Order View:

```text
VIEW = READ ONLY

Back
Edit
Cancel Order (when permitted)
Create WO (when permitted)
Print
```

Payment is informational in View:

```text
Grand Total
Total Paid
Balance
Payment Status
Payment History
```

Payment editing/addition is performed from Edit Sales Order.

Edit Sales Order:

```text
Existing Order Date → prefilled
Existing Deadline   → prefilled
```

The user may change these values, but must not be forced to re-enter them merely to update another field.

### Work Order relationship

```text
1 Active SO Item
        ↓
1 Work Order
```

Quantity does not create additional Work Orders.

### Production UI

Production is an operational board, not a sequential stage wizard.

Allowed production concepts:

```text
Laser Cutting
UV Printing
Assembly
Laser Marking
Finishing
```

Do not introduce `Next Production Stage`, mandatory routing order, or a free stage selector without an explicit V3 change approval.

## Current development state

The active working vertical slice is:

```text
Customer
   ↓
Product
   ↓
Sales Order
   ↓
Payment
   ↓
Work Order
   ↓
Production
```

This slice is the current integration checkpoint. The next business-flow scope is RTS / Handover / Packing / Delivery.

Do not treat the current implementation as proof that the entire ERP is complete. Validate each downstream domain as it is implemented.

## Change-control checkpoint discipline

When a change is completed and the user confirms it works, record the behavior as a working checkpoint before moving to another domain.

Do not reopen a working checkpoint for unrelated cleanup.

A regression fix must target the smallest responsible file/scope and must preserve previously confirmed behavior.

For every implementation task:

```text
1. Scan actual repository state
2. Identify exact file/function/dependency
3. Propose one scoped change
4. Obtain approval
5. Apply only approved change
6. Validate changed behavior
7. Record checkpoint
8. Commit to GitHub
9. User pulls from GitHub
```

Do not loop back to broad repository scans after a confirmed working checkpoint unless the new task genuinely depends on repository-wide context.

## Database rules

PostgreSQL is the relational source of truth. Migrations must be ordered, explicit, reviewable, reversible where practical, and scoped to the approved phase. Prefer additive migrations for established schemas.

## API rules

API contracts must explicitly identify route, method, request, validation, service, repository, response, and errors. Do not create endpoints merely because they seem useful.

## Testing / validation

Every implementation needs validation appropriate to its scope. Minimum validation includes build, configured lint/test, API validation where applicable, database migration validation where applicable, and critical business behavior.

## Stop conditions

Stop and ask for approval if scope expands, another domain must change, legacy behavior conflicts with V3, a migration affects existing data, an API contract changes unexpectedly, authentication assumptions are missing, destructive Git operations appear necessary, manual coding appears necessary, or requirements are ambiguous.

## Golden rule

> Do not code what has not been scanned.
>
> Do not change what has not been approved.
>
> Do not claim what has not been validated.
>
> Do not require manual coding when the AI build workflow can perform the approved work.
