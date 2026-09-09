# Sutras by S³ — V26.1 GitHub Pages Demo

This package is for temporary GitHub Pages testing only.

## Important
- Payments are simulated. No real money is charged.
- Inventory/admin data is stored only in the browser using localStorage.
- The admin page is NOT private or secure. Do not enter real customer or financial data.
- Data does not sync between different browsers/devices.
- All public/demo pages include `noindex` metadata to discourage search indexing.

## Suggested test flow
1. Open `admin-preview.html` and load the 60-stock demo.
2. Open `index.html`, add 2 Navy sets to the enquiry bag, and proceed to checkout.
3. Complete the simulated successful payment.
4. Return to `admin-preview.html` in the SAME browser/device and confirm stock moved from 60 to 58.
5. Repeat with a failed payment and confirm reserved stock is released.
6. Test on a second device and observe that its localStorage is separate. This is expected until a real backend/database is added.

## GitHub Pages publishing
Repository: `Sutras-Wear/sutras-commerce-demo` only.
In Settings → Pages, use **Deploy from a branch**, **main**, **/ (root)**.
The site is https://sutras-wear.github.io/sutras-commerce-demo/ .
No build command is needed. Keep `.nojekyll` and the HTML files in the root.
Relative links/assets work under the project prefix; the custom 404 page uses
the explicit project base so nested missing URLs can return to the demo.

## Demo navigation and reset
The shared demo bar links to Store, Checkout and Admin. The Store header also
links back to the Sutras storefront (`index.html`). Reset Demo clears only:
- `sutras-demo-v26-1-commerce-preview-v1`
- `sutras-demo-v26-1-commerce-cart-v1`
- `sutras-demo-v26-1-enquiry-bag-v1`
- `sutras-demo-v26-1-recently-viewed-v1`
- `sutras-demo-v26-1-checkout-prefill-v1`

It then reloads the test store with empty/default inventory. Open Admin and
load the sample scenario to start again. Production and unrelated storage keys
are never cleared. Payments remain simulated; no payment service is connected.
