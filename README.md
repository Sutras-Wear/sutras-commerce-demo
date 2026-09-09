# V25 — Launch Readiness

V25 adds a clear **How ordering works** journey, a confirmation/trust panel, mobile and footer access to it, a branded `404.html`, `robots.txt`, refreshed sitemap date, fuller social metadata, and launch checklists. It does not invent stock, prices, payment methods, delivery terms or return terms.

### V25 launch files

- `PRE-LAUNCH-CHECKLIST.md` — owner approval + final QA gate
- `DOMAIN-LAUNCH.md` — custom-domain handoff without guessing a domain or DNS values
- `404.html` — branded not-found page, intentionally `noindex`
- `robots.txt` + `sitemap.xml` — current GitHub Pages discovery files
- `test_v25_static.py`, `test_v25_regression_static.py`, `test_v25_browser.py` — current authoritative V25 tests

No `CNAME` is included yet because the custom domain has not been bought/confirmed.

# Current photo display

## V23 — Product Detail 2.0

- Clearer product-detail hierarchy with compact style facts (pieces, style, view).
- Live selected-size cue updates as the customer chooses a size.
- Desktop gallery remains visually prominent and sticky while product details are read.
- Mobile/tablet fall back to the existing stacked gallery layout.
- Existing modelled views, detail gallery, related styles, enquiry bag and add-to-bag confirmation are preserved.


At the owner’s request, all 12 product pages currently show **only the existing AI-modelled main image**. Extra garment photographs and detail crops are no longer shown. The main images, product IDs, garment contents, prices and sizing preferences were not changed. Additional photographs can be added when the owner supplies replacements. Previous gallery configuration is archived in the private workspace; original uploads are retained.

# Sutras by S³

**Pure Cotton Indian Wear**  
Woven in Comfort · Made with Intention  
Lusaka, Zambia

An editorial, mobile-friendly storefront for Sutras’ women’s cotton Indian wear. Designed in warm ivory, terracotta and olive with original illustrative imagery. This is a complete, no-build static website suitable for GitHub Pages.

## Current collection

The catalogue now contains **twelve products**, with the existing four retained and the repeated white photo counted once:

| Product | Included in the listing |
| --- | --- |
| Orange set | Kurta, printed bottoms, plain orange dupatta — 3 pieces |
| Pink set | Kurta, bottoms, tasseled dupatta — 3 pieces |
| Navy set | Kurta and bottoms — 2 pieces, no scarf |
| Green set | Kurta and bottoms — 2 pieces, no scarf |
| White floral set | Collared shirt and floral-hem trousers — 2 pieces, no scarf |
| Yellow short floral kurti | **Top only — 1 piece. Model styling trousers/footwear are not included.** |
| Dark-purple set | Kurta, decorated-hem bottoms, leafy-border dupatta — 3 pieces |
| Plum-purple set | Kurta, narrow-trim bottoms, small-flower dupatta — 3 pieces |

The olive lattice, slate-grey and wine floral kurtis are also included: all three are **short, hip/upper-thigh-length tops only**, with styling trousers excluded.

Every product has a clean modelled main view and its original-photo gallery. Prices and size availability remain unconfirmed; enquiries go to the store. There are no concept product cards.

### First four outfits

- **Orange Three-Piece Kurta Set** now uses the owner-approved **AI model view** as its primary image. The original store photograph and two real-photo detail crops remain in the gallery. Image provenance is described in the gallery captions and product details, not overlaid on the photographs.
- The main modelled view is an AI-generated styling illustration, not proof of exact fit or drape. Images have no overlaid source badges or bottom text strips; the AI-styling explanation is kept in the product details. The other three gallery views come from **one real store photograph**, not three separate camera angles.
- **Pink Three-Piece Kurta Set** is the second owner-photographed product, with a clean modelled main image, the real set photograph and neckline/dupatta detail crops. It replaces the Bela concept card using a new product ID.
- **Navy Two-Piece Kurta Set** is the third photographed product. It contains the printed kurta and matching bottoms only: **no scarf/dupatta**. The modelled image has no draped accessory, and the real set, neckline and print close-ups remain in its gallery. It replaces the Gulabi concept using a new ID.
- **Green Two-Piece Kurta Set** is the fourth of the first supplied outfits: a plain olive-green kurta with red floral yoke detail and coordinating bottoms, **without a scarf/dupatta**. It replaces the final Olive concept with a new product ID.
- **There are no placeholder/concept product cards left in the collection.** All current entries have modelled main views and real source-photo galleries. The campaign and moodboard remain illustrative; the model-view explanation stays outside the pictures.
- Price, size availability, exact measurements and stock must still be confirmed on WhatsApp. The folded bottoms have not been assigned an unverified cut such as churidar, palazzo or salwar.

Website: **https://sutras-wear.github.io/Sutras-by-S3/**  
Repository: **https://github.com/Sutras-Wear/Sutras-by-S3**

## Initial GitHub Pages setup (if needed)

Your repository: **https://github.com/Sutras-Wear/Sutras-by-S3**

1. Download and extract **Sutras-Website.zip**. Open the extracted folder.
2. Sign in to GitHub with an account that can write to `Sutras-Wear/Sutras-by-S3`.
3. Open the repository. If it is still empty, choose **“uploading an existing file”**. Otherwise choose **Add file → Upload files**.
4. Upload the **contents** of the extracted website folder, including the `assets` and `scripts` folders. **Do not upload the ZIP itself, and do not put everything inside another folder.** `index.html` must be at the repository’s top level.
5. Commit the files to the **main** branch.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/ (root)**, then **Save**.
8. Wait for GitHub’s Pages deployment to finish. The Pages settings will show the published address. The intended address is:

   **https://sutras-wear.github.io/Sutras-by-S3/**

The repository has been populated and GitHub Pages is serving the site. The steps above are retained for setup/reference. Updates pushed to the configured publishing branch are deployed by GitHub Pages. No access token belongs in website files or Git history.

No Node.js, npm, backend, API keys or paid host is required. All fonts, illustrations, styles and JavaScript are local files. All paths are relative so the GitHub project subdirectory works correctly.

### Alternative: publish with Git

If you prefer the command line, first clone your repository on **your own authenticated computer**. Copy the website files into it, then run:

```bash
git add .
git commit -m "Add Sutras cotton-wear storefront"
git branch -M main
git push -u origin main
```

Then enable Pages using steps 6–8 above. Do not paste passwords or personal access tokens into a chat or into website files. Use your own GitHub login or credential manager.

## What works

- Responsive desktop, tablet and mobile layouts
- Category filters for kurta sets, kurtas, dresses and co-ord sets
- Search by style, category, colour and description
- Product detail dialogs, accessible photo thumbnails and an enlarged-photo viewer
- Clearly labelled **usual-size preferences**, not claimed stock sizes
- Enquiry bag: add styles, change requested quantities, remove items, clear the bag, add a note
- Browser-local bag persistence (with in-memory fallback when storage is blocked)
- WhatsApp enquiry links for **both** store numbers, including the selected styles, preferred sizes, requested quantities and note
- Instagram links, mobile navigation, FAQs, image fallback, keyboard-accessible dialogs and reduced-motion support
- Page metadata, share image, favicon and a sitemap

## What this is not

There is no online payment processing, inventory system, customer account, newsletter backend or automatic order confirmation. This store takes **enquiries on WhatsApp**, matching the supplied Instagram bio.

WhatsApp links prepare a message. The customer must still send it in WhatsApp. Sutras must confirm actual products, sizes, prices, payment, delivery/collection and return terms. An enquiry is not an order or reservation.

## Confirmed brand information

The brand and business information came from the owner-supplied Instagram bio, not from another similarly named business:

- **Brand:** Sutras by S³
- **Focus:** women’s pure cotton Indian wear
- **Tagline:** Woven in Comfort · Made with Intention
- **Location:** Lusaka, Zambia
- **Instagram:** https://www.instagram.com/sutras.official/
- **WhatsApp 1:** +260 978 865 604
- **WhatsApp 2:** +260 973 668 415

Instagram blocked automated access. No actual Instagram photographs, posts, stock, prices, hours or additional business claims were imported.

## Replace the placeholder photos later

The orange and pink three-piece sets and navy and green two-piece sets use **AI-modelled primary images**, with their actual owner-supplied photographs retained in their galleries. The hero, cotton still life and remaining model images are AI-generated illustrations. All twelve displayed products are based on garments supplied by the owner, not concept listings. The yellow item is sold as a top only, not as the complete styled outfit shown on the model. The retired Bela and Gulabi illustrations are still used only in the inspiration moodboard; the old Noor and Olive assets are not product listings. Store-photo and illustrative items are distinguished in the collection, details, search, bag, FAQs and WhatsApp messages. See `PHOTO-NOTES.md` for the real image’s provenance.

### Quickest photo replacement

Replace these files with real, permission-cleared images using the **same filenames**:

| File | Used for | Recommended crop |
| --- | --- | --- |
| `assets/images/hero.webp` | Main campaign | Portrait, with a little space around the model |
| `assets/images/orange-set-model-clean.webp` | Modelled primary image, no on-image text | 3:4 portrait |
| `assets/images/orange-three-piece-set.webp` | Actual orange set, secondary gallery view | 3:4 portrait |
| `assets/images/orange-set-neckline.webp` | Same-photo neckline crop | 4:5 portrait |
| `assets/images/orange-set-print.webp` | Same-photo fabric crop | 4:5 portrait |
| `assets/images/noor.webp` | Unused original illustration, retained for reference | 3:4 portrait |
| `assets/images/pink-set-model.webp` | Pink set, second collection card | 3:4 portrait |
| `assets/images/pink-three-piece-set.webp` | Actual pink set, gallery reference | Portrait |
| `assets/images/pink-set-neckline.webp` | Same-photo neckline/pleat crop | 4:5 portrait |
| `assets/images/pink-set-dupatta.webp` | Same-photo dupatta/tassel crop | 4:5 portrait |
| `assets/images/bela.webp` | Retired concept; retained for the moodboard | 3:4 portrait |
| `assets/images/navy-set-model.webp` | Navy two-piece set, third collection card | 3:4 portrait |
| `assets/images/navy-two-piece-set.webp` | Actual navy set, no scarf | 3:4 portrait |
| `assets/images/navy-set-neckline.webp` | Same-photo neckline/piping crop | 4:5 portrait |
| `assets/images/navy-set-print.webp` | Same-photo print/pleat crop | 4:5 portrait |
| `assets/images/gulabi.webp` | Retired concept; retained in moodboard | 3:4 portrait |
| `assets/images/green-set-model.webp` | Green two-piece set, fourth collection card | 3:4 portrait |
| `assets/images/green-two-piece-set.webp` | Actual green set, no scarf | 3:4 portrait |
| `assets/images/green-set-yoke.webp` | Same-photo floral-yoke crop | 4:5 portrait |
| `assets/images/green-set-cuff.webp` | Same-photo sleeve/cuff crop | 4:5 portrait |
| `assets/images/olive.webp` | Retired, unused concept image | 3:4 portrait |
| `assets/images/white-floral-set-model.webp` | White floral co-ord set | 3:4 portrait |
| `assets/images/white-floral-set-photo.webp`, `assets/images/white-floral-set-collar.webp`, `assets/images/white-floral-set-print.webp` | White-set original photo and crops | Portrait |
| `assets/images/yellow-kurti-short-model.webp` | Yellow kurti; styling trousers excluded | 3:4 portrait |
| `assets/images/yellow-kurti-photo.webp`, `assets/images/yellow-kurti-neckline.webp`, `assets/images/yellow-kurti-cuff.webp` | Actual yellow top and crops | Portrait |
| `assets/images/dark-purple-set-model.webp` | Dark-purple three-piece set | 3:4 portrait |
| `assets/images/dark-purple-set-photo.webp`, `assets/images/dark-purple-set-neckline.webp`, `assets/images/dark-purple-set-trim.webp` | Dark-purple original photo and crops | Portrait |
| `assets/images/plum-purple-set-model.webp` | Brighter plum-purple three-piece set | 3:4 portrait |
| `assets/images/plum-purple-set-photo.webp`, `assets/images/plum-purple-set-neckline.webp`, `assets/images/plum-purple-set-trim.webp` | Plum-purple original photo and crops | Portrait |
| `assets/images/cotton.webp` | Story and moodboard | 4:5 portrait |
| `assets/images/social-card.jpg` | Link-sharing thumbnail | 1200 × 630 landscape |

Use a real image conversion tool to save WebP files; **renaming a JPEG extension to `.webp` does not convert it**. Alternatively keep the original `.jpg`/`.png` file and update the corresponding image paths in `index.html` and `scripts/catalog.js`.

### Add the actual product details

Open **`scripts/catalog.js`**. Each product has an editable entry:

```js
{
  id: 'unique-product-id',
  name: 'Actual product name',
  category: 'Kurta sets',
  color: 'Actual colour',
  colorHex: '#adbec8',
  image: 'assets/images/your-real-photo.webp',
  imageAlt: 'Accurate description of the actual product photo.',
  description: 'Store-confirmed description.',
  detail: 'Store-confirmed details.',
  price: null,       // Leave null for “Price on enquiry”.
  isPreview: false  // Only after the photo AND product details are real.
}
```

- `isPreview` distinguishes concept products from actual store products. It does **not** assert that an image is a genuine photo.
- `imageKind` identifies the primary image: `ai-model`, `store-photo` or `style-preview`. Each additional gallery image has its own `kind`. These flags drive gallery captions, product details, search, bag and enquiry disclosures. They do not add badges over photographs.
- Optional `setContents` states exactly which pieces are included, and is included in direct and bag WhatsApp enquiries. In particular, the navy and green sets have **no scarf/dupatta**.
- Optional `cardName` provides a shorter name for cards/search/bag while enquiries use the full product `name`.
- Optional `photoNote` explains any actual photo editing; it is shown in the product details.
- Optional `gallery` contains **additional** views: `{ src, label, alt, caption }`. The primary `image` is automatically the first view. Label crops of one photo honestly rather than describing them as additional angles. Remove or update the additional views when replacing the primary product photo.
- Keep each `id` unique. Change the ID when a concept is replaced by a different real product so old saved enquiries do not refer to a different item.
- Use one of these category labels: `Kurta sets`, `Kurtas`, `Dresses`, `Co-ord sets`. If adding another category, add its filter button in `index.html` too.
- Real numeric prices are formatted in **ZMW**. No sample prices are currently displayed. Prices are still to be confirmed on WhatsApp.
- The `isPreview` flag is per-product. Keep it `true` for every remaining concept; the relevant below-image concept labels and enquiry explanations stay visible.
- Once **all** campaign, moodboard and product photos are real, set `imageryIsIllustrative: false`. Do not switch it off while any illustrative images remain.
- Update the hero, story and moodboard `alt` text and the Open Graph image description in `index.html` when the imagery changes.
- Review `#imagery-info`, the FAQ and the collection notes before publishing a mixed real/illustrative catalogue. The script automatically removes the all-preview notice when no preview products remain, but editorial wording should still be reviewed.
- Add real sizing measurements, delivery fees, payment options and returns information only when confirmed. The current “usual size” controls are enquiry preferences only.

## Edit the look & contacts

- `styles.css`: colours are CSS variables at the top; fonts, spacing and responsive layouts follow.
- `index.html`: brand story, hero, contact numbers, Instagram links, FAQs and page metadata.
- `scripts/catalog.js`: product information, dynamic WhatsApp numbers and currency.
- `scripts/app.js`: search, filters, dialogs, bag and WhatsApp message construction.

If changing the phone numbers, update **both** `scripts/catalog.js` and the static links/visible numbers in `index.html` (including structured data). The plain HTML contact links intentionally work without JavaScript too.

## Local preview

Open `index.html` in a modern browser, keeping the folders next to it. Or, if Python is installed:

```bash
python -m http.server 3000
```

Open `http://localhost:3000/` on that same computer. This is a local-development address, not the public website address.

The separately supplied **Sutras-preview.html** is a self-contained preview with embedded images, fonts, styles and scripts. It is convenient for review, but edit and upload the structured website package instead. A restrictive in-app file viewer may block external WhatsApp/Instagram tabs; use the live website or download and open the preview in a regular browser to follow those links.

## Privacy & hosting

There are no analytics, tracking pixels, external font requests or server-side customer records in this site. The enquiry bag and optional note are kept in browser localStorage, if available; clearing the bag removes those saved contents. Links to Instagram or WhatsApp take visitors to those platforms. GitHub Pages is the hosting provider and has its own privacy policy.

Do not put private customer information, payment secrets or credentials in this public repository. All website source files are publicly readable.

## Asset notes

- Orange, pink, navy and green set photography: supplied by the store owner; background isolation, straightening and close-up crops only. No garment details were generated.
- Campaign, model and cotton imagery: original AI-generated temporary illustrations created for this site.
- Icons: original inline SVG line drawings.
- Fonts: Cormorant Garamond and DM Sans, self-hosted under the SIL Open Font License. Their license texts are in `assets/fonts/`.
- No third-party scripts or CDNs are required.

## Share a specific product

Open a product’s details and use **Copy link** or **Share on WhatsApp** below the enquiry button. WhatsApp sharing opens its recipient picker; it does not send a message automatically or replace the business enquiry buttons.

Example: `https://sutras-wear.github.io/Sutras-by-S3/?product=dark-green-floral-two-piece-set`

- The product ID is stable: shared links continue to show later photo/detail updates to that same product. Do not reuse a retired ID for a different item.
- A valid link opens that exact product on arrival or reload. Unknown/retired IDs fall back to the collection with a helpful message.
- Share links include only the public product ID—not the visitor’s size preference, enquiry bag or note.
- If automatic clipboard access is denied, a selectable read-only link appears for manual copying.
- The public base URL comes from the page’s HTTPS canonical URL, never a local preview address.
- Social networks may use the site’s existing general link-preview image; these are client-side product links, not separate server-rendered social-preview pages.

## Homepage starting position

Fresh visits and reloads start at the hero/top of the page, including older bookmarked section-fragment links. Normal menu/section clicks still scroll after arrival. Browser scroll restoration is managed explicitly, and a late image load does not reset the page after the visitor has interacted. Product-sharing URLs continue to open the selected product over the top of the homepage; closing that initial view returns to the top rather than jumping to an off-screen product card. The app script uses a versioned URL so the correction is not hidden by an old mobile cache.




## V22 — Enquiry Bag 2.0
- V20 Build Your Look has been intentionally removed.
- The enquiry bag now has clearer mobile-first item cards, inline requested-size editing, quantity controls, style/selection counts, a continue-browsing action, and a persistent mobile WhatsApp action.
- The bag remains an enquiry shortlist: prices, sizes, availability, delivery and payment are confirmed manually on WhatsApp.

## V24 — Quick View

V24 adds a fast-browsing layer to collection cards without replacing the full product-detail experience.

- The circular **eye** action on every product card opens Quick View.
- Quick View shows the main garment image, colour, piece count, style type, price/enquiry state, availability and included pieces.
- Available styles expose the existing size-preference choices and can be added directly to the enquiry bag.
- Adding from Quick View keeps Quick View open and shows an inline confirmation with **View bag**.
- Unavailable styles can still be viewed and opened in full details, but cannot be added to the bag.
- **View full details** opens the existing V23 gallery/detail experience.
- The Quick View WhatsApp link updates with the selected size preference.
- Desktop uses a compact editorial modal; mobile uses a 90dvh bottom sheet with 42px+ touch targets.
- Quick View does not alter the shareable product URL; only the full product-detail view participates in product-link routing.


## V24.1 — Mobile collection-card polish
- Removed the duplicate availability pill from collection imagery so unavailable styles use the same clean Quick View eye control as every other product.
- Availability remains clearly visible below the product name and inside Quick View/full details.
- Moved the mobile Quick View control slightly inward and reduced the eye icon while preserving the 42px touch target.


## V24.2 — Availability visibility
- Replaced low-contrast availability text with a compact dot + status pill in collection cards.
- Reused the same status language in Quick View and full product details.
- Removed the redundant Quick View availability overlay from the garment image.
- Added styling support for `available`, `low`, `unavailable`, and `sold-out` states while preserving the current truthful fallback `Availability to confirm` when no explicit state is supplied.
- Availability remains informational only; unavailable and sold-out items still cannot be added to the enquiry bag.

---

## V26 — Commerce Foundation (test-mode lab)

V26 adds a **parallel commerce lab** without changing the approved V25 public storefront flow. This is deliberate: Sutras does not yet have confirmed real prices/stock or a verified payment merchant account, so the public website must not pretend checkout is live.

Open:

- `commerce-preview.html` — customer shopping-bag prototype with price/stock-aware Add to Bag and a help-on-WhatsApp action.
- `admin-preview.html` — local inventory admin prototype. Configure test prices, on-hand stock, checkout enablement and low-stock thresholds; review paid test orders and stock movement history.
- `checkout-preview.html` — test checkout and payment simulator. Checkout reserves stock; simulated success permanently reduces on-hand stock; simulated failure releases the reservation.

The **Load 60-stock demo** button deliberately loads obvious TEST values only: Navy K700 / 60 units, Green K650 / 24 units and Yellow K400 / 8 units. Those values are examples, not real Sutras inventory or prices.

### Important production boundary

V26 stores its commerce data in browser `localStorage`. It is a UX + business-logic prototype, not a secure database, payment processor, accounting system or production admin. A future live version must move authoritative inventory/orders to a server-side database, keep payment secrets off the front end, verify payment webhooks, use authenticated admin access and update stock transactionally/idempotently.

## V26.1 — Enquiry Bag → Checkout Bridge

V26.1 connects the existing Sutras enquiry bag to the V26 simulated commerce engine without adding a real payment provider.

- The enquiry bag now contains a prominent **Proceed to checkout** action on desktop and a sticky **Checkout** action on mobile.
- Checkout stays locked until every selected product is enabled in the V26 inventory state, has a numeric test price, and has enough available test stock for the requested quantity.
- When checkout is ready, the bag shows a test total and synchronizes product ID, size and quantity into the V26 commerce cart.
- The optional bag note is carried into the checkout form.
- WhatsApp is retained as customer help: **Need help before ordering? Ask us on WhatsApp.**
- Successful simulated payment clears the original enquiry bag only after the reservation is committed and stock is reduced.
- Failed/cancelled simulated payment releases reserved stock and keeps the original enquiry bag for retry.
- Returning from checkout uses `index.html?bag=open` so the original bag reopens.

**Important:** V26.1 is still a commerce lab. The checkout page is simulated, no real money can be charged, and no production stock or prices have been supplied. Do not deploy this package as the public store yet.
