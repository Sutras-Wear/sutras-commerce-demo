# V25 final test results

Final V25 validation after the tablet breakpoint polish:

- **47 V25 launch-readiness static checks — 0 failed**
- **155 inherited Quick View / product / asset regression checks — 0 failed**
- **21 V25 Chromium interaction / responsive checks — 0 failed**
- **52 V24 Quick View Chromium regression checks — 0 failed**
- **18 V24.2 availability Chromium regression checks — 0 failed**
- **404 page:** desktop 1365px + mobile 440px rendered with no horizontal overflow or page errors
- **Responsive ordering journey:** desktop 1365px, tablet 768px, mobile 440px and small mobile 390px checked

The Chromium tests use the existing in-memory/local-route harness because direct `file://` / localhost navigation can be blocked in the environment. The final custom-domain deployment still needs a live-domain QA pass after the domain is connected.

Historical version-specific static tests (for example V24.1) may intentionally assert UI that later versions replaced; the current V25 regression suites are the authoritative static checks for this package.

# Website verification

Checked on **5 September 2026** using Playwright 1.55 / Chromium and axe-core 4.10.3.

## Functional checks

- PASS — Initial collection has four labelled style previews
- PASS — Category filters and reset work
- PASS — Search is case-insensitive; empty result and clear states work
- PASS — Search handles markup input safely
- PASS — Escape closes dialog and restores keyboard focus
- PASS — Product detail and size preference update the direct WhatsApp enquiry
- PASS — Both WhatsApp links encode the full selection, quantity, size, note and preview disclosure
- PASS — Bag, quantity and note persist after reload
- PASS — Requested quantities respect the per-style limit
- PASS — Different size preferences remain separate selections
- PASS — Remove and clear empty the bag and delete saved personal note
- PASS — Empty bag returns to collection
- PASS — Contact dialog exposes both correct business numbers
- PASS — FAQ accordion expands correctly
- PASS — Imagery and privacy disclosures are available
- PASS — Internal navigation targets and external-link security attributes are valid
- PASS — No horizontal overflow at 320, 360, 390, 600, 768, 1024, 1440 and 1920 pixels
- PASS — Mobile menu opens, navigates and closes
- PASS — Mobile product detail, size selection and enquiry drawer work
- PASS — Mobile search works
- PASS — All imagery and fonts load; no failed requests or JavaScript exceptions

## Additional checks

- PASS — Keyboard Tab navigation remains in the active dialog.
- PASS — Mobile product close button stays visible while scrolling.
- PASS — The enquiry bag works in memory when browser storage is disabled.
- PASS — Visitors without JavaScript have a direct WhatsApp fallback.
- PASS — Relative assets work when the site is served under `/Sutras-by-S3/`.
- PASS — The self-contained preview works in an `allow-scripts` iframe with no network access or local storage.
- PASS — The live-preview server accepts a proxy host and does not set iframe-blocking headers.

## Automated accessibility checks

No WCAG A/AA violations were reported by axe-core for the desktop page, mobile page, search dialog, product dialog, populated enquiry bag, contact dialog or mobile menu in the tested states.

This is a limited automated audit, not an accessibility certification. Full manual screen-reader testing and testing on physical iOS/Android devices are still recommended before a broad public launch.

## Scope and limitations

- Responsive layout checked at widths of 320, 360, 390, 600, 768, 1024, 1440 and 1920 pixels.
- Browser engine tested: Chromium. Safari and Firefox were not separately tested.
- WhatsApp destinations and encoded messages were verified. **No WhatsApp messages were sent**, and no external orders, payments or reservations were made.
- The initial browser checks simulated the GitHub project path locally. The initial site was subsequently uploaded and verified through public GitHub access; GitHub Pages is now serving the site.
- Actual product photography, stock, sizes, prices, delivery fees, payment options and returns terms still need owner-confirmed content.

## Real-photo update — 5 September 2026

- Replaced the Noor concept listing with the owner-photographed Orange Three-Piece Kurta Set, using a new product ID to avoid re-labelling old saved enquiries.
- Verified one **Store photo** card and three **Style preview** cards, including filtered and search results.
- Verified the full-set image and two explicitly labelled same-photo crops, thumbnail selection and the enlarged-photo viewer.
- Closing the enlarged image returns to the underlying product dialog without losing the selected photo or size preference.
- Verified actual-only and mixed actual/illustrative WhatsApp messages, quantity/note persistence and the enquiry bag.
- No overflow at 320, 390, 768, 1024 and 1440 pixels.
- No failed local image requests or JavaScript exceptions in the checked states.
- axe-core reported no A/AA violations for the mixed collection, real-photo detail dialog and enlarged image viewer in the checked Chromium states.
- The original photo with incidental people/background was not added to the public website; only the cleaned exports were used. Image metadata was not carried into the exports.

## Approved AI-modelled main-image update — 5 September 2026

- Verified the approved modelled image is primary in the collection card, search, product details and enquiry bag.
- Kept the actual store photograph and its two detail crops in the four-image gallery.
- Verified per-image AI/actual-photo badges, captions, enlargement and size-preference preservation when switching views.
- Verified AI-modelled-image disclosures in both direct and bag WhatsApp enquiries without changing the real product identity or claiming availability.
- Verified responsive layouts at 320, 390, 768 and 1440 pixels, no JavaScript exceptions, and no automated axe-core A/AA violations in the tested collection and product-dialog states.
- Retained the visible AI-preview footer in the approved image; the primary card and detail view use contain rather than cropping the image.

## Clean on-image presentation — 5 September 2026

- Removed source badges from product images and galleries, and removed the campaign/still-life image-disclosure overlays.
- Exported the exact approved model artwork without the added text strip; garment/model content was not regenerated.
- Kept image-origin explanations in product details and gallery captions, with concept status below the relevant product images.

## Pink set update — 5 September 2026

- Verified two photographed products (orange and pink) and two remaining concept styles, with the retired Bela product ID removed rather than reassigned.
- Verified the pink card, fuchsia search, two-item Kurta sets filter and automatic hiding of the empty Kurtas category.
- Verified all four pink gallery views, photo decoding, enlargement, selected-size retention and the absence of on-image labels.
- Verified both WhatsApp destinations and the correct pink-set name, colour, size and AI-modelled-view explanation in enquiry text.
- Verified a combined orange/pink bag and note survive a reload; stale Bela selections are not converted to pink-set selections.
- Verified no horizontal overflow at 320, 390, 768, 1024 and 1440 pixels.
- No failed requests or JavaScript exceptions in the checked states. axe-core reported zero tested A/AA violations for the collection, pink product dialog and enlarged modelled view.

## Navy two-piece update — 5 September 2026

- Visually checked the generated modelled view: kurta and trousers only, both hands free, and no scarf/dupatta or draped accessory.
- Verified three actual photographed products plus the one remaining Olive concept, with Gulabi retired using a new navy product ID rather than reassigning saved selections.
- Verified navy search, the three-item Kurta sets filter, and automatic hiding of the empty Dresses category.
- Verified the four-view navy gallery, real-photo decoding, enlargement and selected-size retention, with no labels over the images.
- Verified that product copy and both direct/bag WhatsApp messages explicitly say the navy set has two pieces and no scarf/dupatta. Orange/pink enquiries retain their correct three-piece contents.
- Verified a three-product bag and note across reload, stale Gulabi selection handling, and responsive widths of 320, 390, 768, 1024 and 1440 pixels.
- No failed requests or JavaScript exceptions in the checked states. axe-core reported zero tested A/AA violations for the collection, navy product dialog and enlarged modelled view.

## Green set and completed four-outfit collection — 5 September 2026

- Visually checked the green modelled view: floral-yoke kurta and coordinating trousers only, no scarf/draped accessory, and no on-image text.
- Verified four source-photo-based products and zero remaining concept product cards; the old Olive ID is retired rather than reassigned.
- Verified the green search result, four-view gallery, real-photo decoding, enlargement and size-preference retention.
- Verified two-piece/no-scarf wording in the green page and both direct/bag enquiries. A four-product bag includes two three-piece sets and two two-piece sets, and survives reload with its note.
- Verified the collection’s model-image explanation remains visible outside the pictures even with no concept products. FAQ/site notes no longer imply that concept product cards remain. Redundant category controls are hidden when all products share one category.
- Verified no horizontal overflow at 320, 390, 768, 1024 and 1440 pixels, and correct handling of stale Olive selections.
- No failed requests or JavaScript exceptions in the checked states. axe-core reported zero tested A/AA violations for the collection, green product dialog and enlarged modelled view.

## Four additional designs — 5 September 2026

- Verified eight unique products: all existing four preserved, one white floral set (not duplicated), yellow kurti/top only, and two distinct purple three-piece sets.
- Visually checked the four modelled views: white set without scarf; yellow kurti styled with plain ivory trousers; dark-purple set with decorated hems and leafy-border dupatta; plum-purple set with narrow-trim trousers and small-flower dupatta. No on-image text or source badges were added.
- Verified the yellow top-only title/card, description, photo note and both WhatsApp enquiry messages exclude the model styling trousers/footwear.
- Verified category counts (6 kurta sets, 1 kurti, 1 co-ord set), search, all four new galleries and detail-image decoding, enlargement, retained size preferences, both WhatsApp destinations and bag/note persistence.
- Verified the 50-distinct-selection safeguard: a new combination is refused at the limit while quantity can still increase on an existing selection. This prevents newer selections from silently disappearing on reload.
- No horizontal overflow at 320, 390, 768, 1024 and 1440 pixels, no failed requests or JavaScript exceptions, and zero tested axe A/AA violations for the collection, top-only product and three-piece product states.
- Verified the four new galleries, enlarged images and enquiry bag in the self-contained sandboxed preview with no network or storage access.

## Yellow short-kurti correction — targeted checks

- Compared the corrected modelled view with the white-top length reference; the yellow hem is now hip/upper-thigh rather than calf length.
- A targeted colour-region check confirms the yellow fabric ends above image y=720 in the 1200-pixel-high model frame and over 180 pixels higher than before.
- Verified only the yellow product record changed, all eight products remain, its original gallery is unchanged and top-only/styling-trouser exclusions are preserved.
- Updated the modelled asset, old asset URL, individual download, image-pack ZIP and overview image. No application logic or styling was changed; a full-site retest was not repeated.

## Product-specific sharing — 6 September 2026

- Verified valid product links open the exact item on arrival/reload, and unknown IDs return to normal browsing without a JavaScript exception.
- Verified card opening updates the visible product URL; closing the product or moving to the bag removes the selection parameter while preserving other URL parameters.
- Verified the copied URL uses the public GitHub Pages address and contains only the product ID. Clipboard success was mocked; denial was separately tested with a selectable manual-copy fallback and no false success message.
- Verified WhatsApp sharing contains the correct product title/link and uses the recipient picker, while both existing store-enquiry destinations remain unchanged. No WhatsApp messages were sent by these tests.
- Verified gallery enlargement/closing, product size preference, enquiry bag, keyboard containment and mobile direct-link opening.
- No horizontal overflow at 320, 390, 768 and 1440 pixels. The tested product dialog with the manual-copy field had zero axe-core A/AA violations.

## Mobile startup scrolling — 6 September 2026

- In mobile Chromium emulation, verified scroll position zero on fresh home visits, reload after scrolling, and arrivals using old collection/story/contact fragments.
- Verified browser page-cache return handling and normal Back navigation to the homepage.
- Verified deliberate collection-menu clicks still scroll, both with reduced motion and normal motion.
- Delayed the hero image response, clicked a section link before loading finished, then released the image; the late load did not pull the visitor back to the top.
- Verified shared product URLs still open the correct product while the underlying homepage remains at the top, including after closing the dialog.
- No JavaScript exceptions in these checks. These are browser-emulation checks, not a physical-device Safari certification.




## V22 — Enquiry Bag 2.0 tests
- Confirm V20 Build Your Look markup/functions/styles are absent.
- Confirm bag size selectors, quantity controls, remove, clear, continue browsing, note persistence and WhatsApp links are wired.
- Confirm mobile sticky WhatsApp action exists and uses the same generated enquiry message as the desktop WhatsApp action.
- Confirm responsive CSS includes 760px and 380px layouts with safe-area handling and no intentional horizontal overflow.
- Live Chromium click-through remains environment-blocked when local development servers are opened; do not represent static checks as live browser testing.


## V23 — Product Detail 2.0

Static regression coverage includes HTML parsing, JavaScript syntax, duplicate IDs, product-detail controls, gallery controls, live size selection cue, desktop sticky-gallery rules, responsive fallback rules, preserved enquiry-bag controls, catalogue metadata, V20 removal, and local asset references. Live browser click-through was attempted separately when possible; if the environment blocks Chromium, that limitation is reported rather than treated as a pass.

## V24 — Quick View tests — 8 September 2026

- Static regression suite: **155 checks, 0 failures** (`test_v24_static.py`). Coverage includes HTML parsing, app/catalog JavaScript syntax, Quick View wiring, unavailable-state handling, responsive/reduced-motion rules, V23 feature preservation, 12 unique catalogue products, metadata, and every referenced local HTML/CSS/catalogue asset.
- Chromium interaction suite: **52 checks, 0 failures** (`test_v24_browser.py`) using an in-memory page harness. This avoids the environment's blocked `file://`/localhost navigation while still exercising the real DOM, dialogs, JavaScript and responsive CSS in system Chromium.
- Desktop checks covered: all 12 Quick View triggers opening/closing, all seven size buttons, available and unavailable products, size selection, size-aware WhatsApp link, add-to-bag without forced bag opening, inline confirmation, View Bag, duplicate-selection quantity merge, Quick View → full details, Escape close, V23 facts/gallery/size/add behavior, search, bag size merge, quantity +/- controls, modal geometry, and JavaScript page errors.
- Mobile checks covered: 390×844 viewport, 42×42 minimum Quick View card trigger, full-width bottom sheet, 90dvh height limit, size selection, add confirmation, no forced bag opening, Escape close, and JavaScript page errors.
- Visual screenshots were inspected for both desktop and mobile Quick View layouts. The modelled garment image, typography, action hierarchy and responsive sheet presentation render as intended.
- No page errors were reported in the tested desktop or mobile Chromium states.


## V24.1 regression
- Confirm unavailable product cards do not show an availability pill over the garment image.
- Confirm availability still appears in product metadata and inside Quick View.
- Confirm all product cards use the same Quick View eye treatment on mobile.
- Confirm mobile Quick View touch target remains 42px and is inset from the image edge.


## V24.2 regression
- Availability status is visually distinct on all 12 collection cards.
- Current unspecified stock remains labelled `Availability to confirm`; no product is falsely marked available.
- Currently unavailable products use the warm rust status treatment.
- Quick View and full product details reuse the same status component.
- No availability status is placed over collection-card garment imagery.
- Existing unavailable/sold-out add-to-bag restrictions are preserved.
- V24 Quick View, V24.1 mobile-eye, V23 product detail, search, and bag interaction regressions remain in the test suite.

---

## V26 — Commerce Foundation test results

V26 adds a local commerce lab alongside the untouched approved V25 storefront.

### New V26 tests

- `node test_v26_core.js` — **25 checks, 0 failures**
  - no fake default prices/stock
  - explicit demo stock only
  - 60 → reserve 2 → 58 available
  - successful payment commits 60 → 58 on-hand
  - duplicate success is idempotent (no second stock decrement)
  - failed/cancelled payment releases reservations
  - overselling blocked
  - manual adjustment cannot reduce on-hand below reserved
- `python test_v26_static.py` — **33 checks, 0 failures**
  - all preview/admin/checkout files present
  - HTML titles + noindex/test-mode disclosure
  - Node syntax checks for all new JS
  - inventory/reservation/idempotency architecture present
  - default price/stock remain unset
  - WhatsApp is positioned as help in commerce preview
  - V25 public index remains packaged
- `/opt/pyvenv/bin/python test_v26_browser.py` — **38 checks, 0 failures**
  - all 12 products render in Inventory Admin
  - one-click demo sets Navy K700 / 60, Green K650 / 24, Yellow K400 / 8
  - customer Add to Bag and K1,400 total for 2 × Navy
  - checkout receives cart and reserves stock
  - verified-success simulation changes Navy on-hand 60 → 58 exactly once
  - duplicate payment-success call does not decrement stock twice
  - post-payment Admin shows one paid order, K1,400 revenue and Navy 58
  - failed-payment simulation restores Green 24 / 0 reserved / 24 available
  - no horizontal overflow on store/admin/checkout at 1365, 768, 440 and 390px
  - no uncaught page errors

The environment's Chromium policy blocks normal `file://`, localhost and arbitrary navigation. V26 browser tests therefore use the same honest in-memory Chromium harness approach used by recent Sutras regression tests: real HTML/CSS/JS is loaded into Chromium, local storage is emulated for the sandbox, product images/fonts are embedded for visual inspection, and state snapshots are carried between test pages. This tests actual DOM events and browser rendering but is **not** a live deployment/payment-provider test.

### Inherited V25 regression

The approved public V25 site files `index.html`, `styles.css`, `scripts/app.js`, `scripts/catalog.js`, `404.html`, `robots.txt` and `sitemap.xml` are byte-for-byte unchanged from the approved V25 ZIP.

- `python test_v25_static.py` — **47 checks, 0 failures**
- `python test_v25_regression_static.py` — **155 checks, 0 failures**
- `/opt/pyvenv/bin/python test_v25_browser.py` — **21 checks, 0 failures**
- `/opt/pyvenv/bin/python test_v24_2_browser.py` — **18 checks, 0 failures**

Note: the old `test_v24_static.py` contains cache-bust assertions specifically expecting the V24 query string, so those three version-string checks are obsolete once the approved site is V25. It is retained only as historical test material and is not counted as a V26 regression failure.

### V26 visual captures

- `v26-admin-desktop.png`
- `v26-store-desktop.png`
- `v26-store-mobile.png`
- `v26-checkout-mobile.png`

### Production boundary still untested

Before real payments: real backend/database, admin authentication, merchant/KYC account, provider sandbox, signed webhook verification, HTTPS production endpoint, real concurrent checkout tests, refunds, reconciliation and live-domain QA are still required.

## V26.1 — Enquiry Bag Checkout Bridge

Final V26.1-specific validation:

- `test_v26_1_static.py`: **45 checks, 0 failures**
- `test_v26_1_browser.py`: **35 Chromium checks, 0 failures**
- `test_v26_core.js`: **25 checks, 0 failures**
- `test_v26_browser.py`: **38 Chromium checks, 0 failures**
- `test_v25_static.py`: **47 checks, 0 failures**
- `test_v25_regression_static.py`: **156 checks, 0 failures**
- `test_v25_browser.py`: **21 Chromium checks, 0 failures**
- `test_v24_browser.py`: **52 Chromium checks, 0 failures**
- `test_v24_2_browser.py`: **18 Chromium checks, 0 failures**

V26.1-specific browser coverage includes:

- checkout disabled when stock/price is not configured;
- checkout enabled for the explicit Navy demo (60 units at test price K700);
- bag total changes from K700 to K1,400 when quantity changes from 1 to 2;
- enquiry bag synchronizes `{productId, size, quantity}` into the commerce cart;
- optional bag note prefills checkout;
- quantity above available stock re-locks checkout;
- reservation flow produces on-hand 60 / reserved 2 / available 58;
- successful simulated payment produces on-hand 58 / reserved 0 / available 58;
- successful payment clears the original enquiry bag and commerce cart;
- failed payment restores availability and preserves the original enquiry bag;
- mobile sticky Checkout is at least 48px high, with no horizontal overflow;
- WhatsApp remains visible as help on desktop and mobile;
- no uncaught Chromium errors in the V26.1 checkout-bridge tests.

The Chromium harness still uses an in-memory page because direct `file://` and local-server navigation is blocked by this environment. Asset requests and real DOM/browser events are exercised, but this is not a live GitHub Pages or real payment-provider test.
