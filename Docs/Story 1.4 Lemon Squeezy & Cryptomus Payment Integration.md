Story 1.4: Lemon Squeezy & Cryptomus Payment Integration

Status: Draft

Story

As a User

I want to purchase credits using Credit Card (via Lemon Squeezy) or Crypto (via Cryptomus)

so that I can fund my account using my preferred payment method

Acceptance Criteria (ACs)

"Buy Credits" UI displays pricing packages with options to pay via "Card/PayPal" (Lemon Squeezy) or "Crypto" (Cryptomus).

Lemon Squeezy Checkout integration implemented (Redirect or Overlay) with correct user metadata.

Cryptomus Payment creation implemented, generating a payment address/link.

Webhook handlers created for BOTH providers to verify success securely.

Successful payments from either provider automatically insert a PURCHASE record and update user credits.

Tasks / Subtasks

[ ] Task 1 (AC: 1) Pricing UI Updates

[ ] Update app/(dashboard)/billing/page.tsx.

[ ] Add a "Payment Method" toggle or separate buttons ("Pay with Card", "Pay with Crypto") on the pricing cards.

[ ] Task 2 (AC: 2) Lemon Squeezy Integration

[ ] Install @lemonsqueezy/lemonsqueezy.js.

[ ] Create API api/payment/lemonsqueezy/checkout.

[ ] Create Checkout session passing custom_data (user_id, credits).

[ ] Task 3 (AC: 3) Cryptomus Integration

[ ] Create API api/payment/cryptomus/checkout.

[ ] Implement HTTP POST to Cryptomus /v1/payment (signature generation required).

[ ] Pass order_id (internal UUID) and additional_data (user_id).

[ ] Task 4 (AC: 4, 5) Webhook Handlers

[ ] Create api/webhooks/lemonsqueezy: Verify X-Signature, handle order_created, update DB.

[ ] Create api/webhooks/cryptomus: Verify sign, handle paid status, update DB.

[ ] Refactor CreditManager to accept a generic provider string ('LEMON', 'CRYPTO') for the transaction log.

Dev Technical Guidance

Lemon Squeezy:

Use store_id and variant_id from your LS Dashboard.

Webhook secret verification is critical.

Docs: https://docs.lemonsqueezy.com/api

Cryptomus:

Requires merchant_id and payment_api_key.

The signature hash for request involves base64_encode(json_body) + api_key (MD5).

Docs: https://doc.cryptomus.com/

Env Vars:

LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET

CRYPTOMUS_MERCHANT_ID, CRYPTOMUS_API_KEY