# Sutras by S³ — V26 Commerce Architecture

## What V26 proves

V26 is a safe local prototype of the commerce rules before Sutras connects real money or real stock.

Core stock model per product/variant:

- **On hand** — physical units Sutras owns.
- **Reserved** — units held temporarily while a customer is in checkout.
- **Available** — `on_hand - reserved`.
- **Low-stock threshold** — when the storefront should show a low-stock state.

Example:

1. Navy starts with `on_hand = 60`, `reserved = 0`, `available = 60`.
2. Customer checks out 2: `on_hand = 60`, `reserved = 2`, `available = 58`.
3. Verified payment succeeds: `on_hand = 58`, `reserved = 0`, `available = 58`.
4. If payment fails instead: `on_hand = 60`, `reserved = 0`, `available = 60`.

This prevents overselling while also avoiding the bad rule “click Pay = permanently remove stock.”

## Production data model

Recommended tables/collections:

### products
- id
- name
- description
- category
- active

### variants
- id
- product_id
- sku
- size
- price_zmw
- low_stock_at
- active

### inventory
- variant_id
- on_hand
- reserved
- updated_at

### inventory_reservations
- id
- checkout_reference
- status: reserved / paid / released / expired
- expires_at

### reservation_items
- reservation_id
- variant_id
- quantity
- unit_price_snapshot

### orders
- id
- customer/contact fields
- fulfilment fields
- status
- subtotal
- payment_status
- created_at
- paid_at

### order_items
- order_id
- variant_id
- sku_snapshot
- product_name_snapshot
- size_snapshot
- quantity
- unit_price_snapshot

### payments
- order_id
- provider
- provider_reference
- provider_event_id (UNIQUE)
- amount
- currency
- status
- raw event/audit reference

### stock_movements
- variant_id
- type: opening / adjustment / reservation / sale / release / refund
- quantity_delta
- reference
- created_by
- created_at

## Server responsibilities

The public browser must never be trusted to declare that payment succeeded or to directly change authoritative stock.

A production backend should expose a narrow API such as:

- `GET /api/products` — public prices and availability.
- `POST /api/cart/validate` — validate current price/stock.
- `POST /api/checkout` — create a server-side reservation and payment session.
- `POST /api/payments/webhook` — verified provider-to-server payment event.
- `GET /api/admin/inventory` — authenticated admin inventory view.
- `POST /api/admin/inventory/adjust` — authenticated stock adjustment with audit trail.
- `GET /api/admin/orders` — authenticated order list.

## Payment-success transaction

Inside one database transaction/lock:

1. Verify the payment event/signature using the provider's server-side secret.
2. Reject/ignore already-processed provider event IDs (idempotency).
3. Load the reservation and verify it is still payable.
4. Confirm amount, currency and order reference match.
5. For every item, decrement `on_hand` and decrement `reserved` exactly once.
6. Mark reservation/order paid.
7. Write payment and stock-movement records.
8. Commit the transaction.

If any check fails, do not fulfil the order and do not silently change stock.

## Reservation expiry

A checkout reservation should have a short expiry (V26 models 15 minutes). Expired/failed sessions release reserved units automatically so customers do not lock stock forever.

## Admin/security requirements before launch

- Parent/business owner controls the verified merchant and admin accounts.
- Admin area requires real authentication and authorization.
- Payment/API secrets stay server-side only; never commit them to GitHub Pages.
- HTTPS everywhere.
- Server-side validation for price, quantity, stock and order totals.
- Rate limiting and CSRF/session protections appropriate to the chosen backend.
- Audit trail for manual stock changes and refunds.
- Backups/export for orders and inventory.
- Privacy/returns/delivery/payment policies finalized before taking real customer money.

## Accounting boundary

The V26 admin is **inventory + sales reporting**, not formal accounting software. It can later track sales, cost of goods, fees, refunds and gross profit, but tax filings, statutory accounting and reconciliation should use the business's proper accounting records/process.

## Hosting direction

The existing GitHub Pages front end can remain. The live commerce layer will need a separate secure backend/database or a commerce platform API. We should choose the production stack only after comparing the payment provider, merchant-account requirements, cost, Zambia support, hosting/security and the family's preferred admin workflow.
