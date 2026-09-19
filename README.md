# Sutras by S³

Storefront codebase for **Sutras by S³**, a women’s clothing brand based in Lusaka, Zambia. This repository supports the current customer experience and the future official storefront launch.

## Current Status

The website is currently running in **WhatsApp enquiry mode**.

Customers can:

- Browse the collection
- View product details
- Select sizes and quantities
- Add items to a Shopping Bag
- Send the full selection to Sutras through WhatsApp

Direct website ordering and online payments are intentionally disabled for now.

## Live Website

Current GitHub Pages site:

[Visit Sutras by S³](https://sutras-wear.github.io/sutras-commerce-demo/)

The custom domain:

`https://sutrasbys3.com`

is owned but is **not connected yet**. Connecting it requires a separate launch decision; the current website remains on GitHub Pages.

## Backend

The storefront uses **Supabase** for shared inventory data.

Current backend protections include:

- Row Level Security
- Restricted customer permissions
- Hidden QA/test inventory
- Customer inventory writes blocked
- Customer order/reservation functions disabled while enquiry mode is active
- Narrow public inventory interface exposing only storefront-required fields

The public inventory view exposes eight fields: `id`, `name`, `price_zmw`, `currency`, `available_quantity`, `sizes`, `availability` and `is_low_stock`. Internal reserved quantities, thresholds, version fields and timestamps are not available through this interface. Inventory is shared across browsers and devices; local storage is used for Shopping Bag preferences and notes, not as the inventory source of truth.

## Current Release

**V29.2 — Security & Domain Readiness**

This release includes:

- WhatsApp enquiry-only storefront
- Shared Supabase inventory
- Shopping Bag
- Responsive mobile and desktop experience
- Product Quick View and full product details
- Style Finder
- Availability handling
- Security hardening
- Safer catalogue rendering
- Inventory privacy improvements
- Active browser Content Security Policy
- Custom-domain and Cloudflare launch preparation

## Ordering

At the moment, submitting a WhatsApp enquiry does **not** automatically create or confirm an order.

Final availability, sizing, pricing, delivery or collection details are confirmed directly by Sutras.

Both WhatsApp contact lines support enquiries containing product names, selected sizes, quantities and customer notes. Opening WhatsApp does not create an order, reserve stock or record a successful payment. Current catalogue products remain browseable with direct ordering disabled.

## Real Catalogue Update — September 2026

The collection now contains 24 real garment listings with 129 optimized photographs and owner-confirmed ZMW prices. Existing campaign/styling image assets are retained. Available sizes and stock quantities have been deferred by the owner; these listings show availability to confirm and an unspecified size for WhatsApp enquiries.

New listings use unique `real-` product IDs. No old inventory row has been reassigned and no live inventory quantity has been changed. Supabase remains connected through the existing read-only public view. Until an exact matching inventory row is established, an `inventoryPending` listing displays its `confirmedPrice` without claiming stock availability. A valid matching shared row takes precedence; invalid data or an outage never produces a stock count. Unknown legacy listings still retain the existing unavailable behavior.

When confirmed sizes and quantities arrive, create/verify the exact matching shared inventory records before removing the pending marker. Do not map products by colour alone or carry over previous quantities. Customer ordering, payment and reservations remain disabled, and the custom domain remains deferred.

## Future Inventory Update

When final stock arrives, the storefront will be updated with:

- Real garment photographs
- Final ZMW prices
- Confirmed sizes
- Actual stock quantities
- Updated product descriptions and availability

The existing website architecture supports these catalogue updates without redesigning the storefront. Enabling real ordering is a separate step and requires confirmed product names, prices, sizes and stock, plus an explicitly approved commerce launch.

## Future Commerce Support

V29 backend foundations are preserved in the Supabase project and private release/setup materials for future:

- Order creation
- Inventory reservations
- Overselling prevention
- Reservation expiry
- Payment integration through a future provider and verified webhooks
- Secure order confirmation
- Admin and inventory management

Customer access to transactional functions remains disabled until Sutras is ready to activate direct online ordering. Private administrative and reservation-expiry operations remain available to authorized operators. No real payment provider is connected. Backend migrations, administrative tools and test assets are kept separate from the public storefront.

## Technology

- HTML
- CSS
- JavaScript
- Supabase
- GitHub Pages
- Cloudflare for future custom-domain DNS and security configuration

## Deployment

The current customer-facing website is served through GitHub Pages from the `main` branch. Static HTML, CSS, JavaScript and assets are published directly; the storefront requires no application build step.

The final public deployment is planned for:

`https://sutrasbys3.com`

## Security

The storefront has been tested for:

- Exposed secrets
- Unauthorized inventory writes
- Hidden QA access
- Customer order/reservation access
- Unsafe catalogue rendering
- XSS-related input handling
- Unsafe image URLs
- Path traversal-style requests
- HTTPS and mixed-content issues

No service-role keys, database passwords, or private administrative credentials should ever be committed to this repository.

The Supabase publishable key in the frontend is intentionally public; database permissions enforce access boundaries. Product text is escaped and rendered through a restricted HTML renderer, and product image URLs are limited to approved local asset paths.

The active meta CSP restricts scripts and API connections and blocks unapproved inline JavaScript. Inline styles remain allowed to preserve the current design. A `no-referrer` policy is also present. GitHub Pages does not support arbitrary custom response headers: response-header anti-framing protection, `X-Content-Type-Options` and `Permissions-Policy` are prepared for the future Cloudflare launch, not claimed as active protections on the current host.

Shopping Bag notes are stored locally and included in WhatsApp enquiry URLs. They should not contain sensitive personal information. QA products must remain unpublished and checkout-disabled. Changes to database access or customer ordering require explicit review and verification.

## Contact

**Sutras by S³**  
Lusaka, Zambia

Instagram: `@sutras.official`

WhatsApp:
- `+260 978 865 604`
- `+260 973 668 415`

---

**Woven in Comfort · Made with Intention**
