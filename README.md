# Sutras by S³

Official storefront codebase for **Sutras by S³**, a women’s clothing brand based in Lusaka, Zambia.

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

https://sutras-wear.github.io/sutras-commerce-demo/

The custom domain:

`https://sutrasbys3.com`

has been purchased and will be connected during the final production launch.

## Backend

The storefront uses **Supabase** for shared inventory data.

Current backend protections include:

- Row Level Security
- Restricted customer permissions
- Hidden QA/test inventory
- Customer inventory writes blocked
- Customer order/reservation functions disabled while enquiry mode is active
- Narrow public inventory interface exposing only storefront-required fields

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
- Content Security Policy preparation
- Custom-domain and Cloudflare launch preparation

## Ordering

At the moment, submitting a WhatsApp enquiry does **not** automatically create or confirm an order.

Final availability, sizing, pricing, delivery or collection details are confirmed directly by Sutras.

## Future Catalogue Update

When final stock arrives, the storefront will be updated with:

- Real garment photographs
- Final ZMW prices
- Confirmed sizes
- Actual stock quantities
- Updated product descriptions and availability

The existing website architecture is designed so these updates can be made without rebuilding the storefront.

## Future Commerce Support

The codebase already contains preserved backend foundations for future:

- Order creation
- Inventory reservations
- Overselling prevention
- Reservation expiry
- Payment integration
- Secure order confirmation
- Admin and inventory management

These features remain disabled until Sutras is ready to activate direct online ordering.

## Technology

- HTML
- CSS
- JavaScript
- Supabase
- GitHub Pages
- Cloudflare for future custom-domain DNS and security configuration

## Deployment

The current production-preview deployment is served through GitHub Pages from the `main` branch.

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

## Contact

**Sutras by S³**  
Lusaka, Zambia

Instagram: `@sutras.official`

WhatsApp:
- `+260 978 865 604`
- `+260 973 668 415`

---

**Woven in Comfort · Made with Intention**
