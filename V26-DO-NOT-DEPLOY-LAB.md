# V26.1 Commerce Lab — DO NOT DEPLOY AS THE PUBLIC STORE

V26.1 intentionally connects the public-looking `index.html` enquiry bag to the **simulated** V26 checkout. This is useful for end-to-end testing, but it is not production commerce.

Do not deploy this package as the live Sutras store until all of the following are complete:

- real prices and stock are supplied and verified;
- inventory is moved from browser localStorage to a secure server/database;
- checkout is moved behind a secure backend;
- a verified adult/legal business owner completes payment-provider onboarding/KYC;
- a real provider webhook is implemented and verified server-side;
- privacy, delivery, returns/refunds and payment policies are finalized;
- security and live-domain regression tests pass.

The V26/V26.1 payment buttons are simulations only. No real money can be charged.
