# V26 — Human Test Guide

This version is intentionally a commerce **lab**, not live checkout.

## Fast “60 → 58” test

1. Open `admin-preview.html`.
2. Click **Load 60-stock demo** and confirm.
3. Check Navy Kurta Set: On hand 60, Reserved 0, Available 60, test price K700.
4. Open `commerce-preview.html`.
5. Add quantity **2** of Navy to the bag.
6. Proceed to test checkout.
7. Fill/keep the test customer details and click **Reserve stock & continue to test payment**.
8. Open the Inventory Admin in another tab: Navy should show On hand 60, Reserved 2, Available 58.
9. Back in checkout, click **Simulate successful payment**.
10. Refresh Inventory Admin: Navy should show On hand 58, Reserved 0, Available 58; Paid orders should increase by 1; test revenue should include K1,400.

## Failed-payment test

1. Reset and load the demo again.
2. Add a product to bag and reserve it in checkout.
3. Click **Simulate failed / cancelled payment**.
4. Verify Reserved returns to 0 and On hand is unchanged.

## Oversell test

Try adding/checking out more units than Available. The flow must block it.

## Important

Do not enter real customer data. No payment is real. V26 data is browser-local and can be reset at any time.

## V26.1 — Test checkout from the real Sutras bag

For the most reliable multi-page storage test, serve this folder from one local origin (for example VS Code Live Server) or test it from a private GitHub Pages branch. `file://` local-storage behavior can vary by browser.

1. Open `admin-preview.html` and click **Load 60-stock demo**.
2. Open `index.html` from the same origin.
3. Quick View **Navy Kurta Set**, choose a size, and add it to the enquiry bag.
4. Open the enquiry bag. The bag should show a test total and **Proceed to checkout** should be enabled.
5. Increase quantity to 2. The test total should become **K1,400**.
6. Add an optional note, then choose **Proceed to checkout**.
7. The checkout summary should show Navy ×2 and the note should be prefilled.
8. Submit the test checkout. Stock becomes on-hand 60 / reserved 2 / available 58.
9. Choose **Simulate successful payment**. Stock becomes on-hand 58 / reserved 0 / available 58, and the original bag clears.
10. Repeat and choose **Simulate failed / cancelled payment**. On-hand stock stays 60, reservations return to 0, and the original bag remains for retry.

No button in V26.1 can charge real money.
