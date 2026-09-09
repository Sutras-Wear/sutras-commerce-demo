# Sutras by S³ — V25 pre-launch checklist

Use this before the custom domain goes public. Do not mark product facts as confirmed until the owner supplies them.

## Product truth
- [ ] Replace placeholder / enquiry-only prices with confirmed prices where applicable.
- [ ] Confirm each product's availability state.
- [ ] Confirm which sizes are genuinely available; usual-size buttons must not be treated as stock.
- [ ] Add the owner's new real garment photos when supplied.
- [ ] Re-check included pieces and descriptions against the actual garments.

## Business details
- [ ] Confirm payment methods with the owner before publishing them.
- [ ] Confirm delivery / collection areas, fees and timing before publishing them.
- [ ] Confirm exchange / return terms before publishing a policy.
- [ ] Confirm both WhatsApp numbers and Instagram account are still correct.

## Domain / SEO
- [ ] Buy the chosen domain.
- [ ] Add the domain to GitHub Pages and create the repository CNAME only after the domain is known.
- [ ] Replace the GitHub Pages URL in canonical, Open Graph, JSON-LD, sitemap and robots.txt with the custom HTTPS domain.
- [ ] Confirm HTTPS is enforced.
- [ ] Re-test the social-card image from the public domain.

## Final QA
- [ ] Desktop, tablet and phone layouts.
- [ ] All navigation links and menu links.
- [ ] All 12 product cards and Quick View triggers.
- [ ] Product details, gallery, size preference and related styles.
- [ ] Search, category filters, Style Edits and Style Finder.
- [ ] Enquiry bag add / remove / quantity / size merge / note / persistence.
- [ ] Both WhatsApp numbers and generated enquiry message.
- [ ] Instagram links.
- [ ] Availability labels match catalogue data.
- [ ] 404 page and robots / sitemap.
- [ ] Keyboard dialog close / Escape and visible focus.
- [ ] No broken local assets or console errors.

## Launch gate
Launch only after the owner approves the real product information and the final live-domain QA passes.


## V26 commerce lab boundary

- [ ] Do **not** deploy the V26 local commerce lab as production checkout.
- [ ] Keep V25 enquiry/WhatsApp ordering live until real price/stock data, backend/database, merchant account, payment-provider sandbox and security tests are complete.
- [ ] Before enabling real payments, replace localStorage inventory with server-authoritative inventory and authenticated admin controls.
