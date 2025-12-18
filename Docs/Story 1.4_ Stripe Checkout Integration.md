# **Story 1.4: Stripe Checkout Integration**

## **Status: Draft**

## **Story**

* As a User  
* I want to purchase a credit package via Stripe  
* so that I can add funds to my account

## **Acceptance Criteria (ACs)**

1. "Buy Credits" page created with package options (e.g., 10 credits for $15).  
2. Stripe Checkout session integration implemented.  
3. Stripe Webhook handler implemented to verify payment success.  
4. Webhook automatically inserts a PURCHASE record into transactions table (updating user balance).

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1\) Pricing UI  
  * \[ \] Create app/(dashboard)/billing/page.tsx.  
  * \[ \] Display 3 pricing cards (Starter, Pro, Agency) as per UI Spec.  
* \[ \] Task 2 (AC: 2\) Checkout Session  
  * \[ \] Create API route api/stripe/checkout.  
  * \[ \] Implement logic to create Stripe Session with metadata (user\_id, credits\_amount).  
  * \[ \] Frontend calls this API and redirects to Stripe URL.  
* \[ \] Task 3 (AC: 3, 4\) Webhook Handler  
  * \[ \] Create API route api/webhooks/stripe.  
  * \[ \] Use stripe library to verify signature.  
  * \[ \] Handle event checkout.session.completed.  
  * \[ \] Extract user\_id and credits from metadata.  
  * \[ \] Insert record into transactions table via Supabase Admin client.

## **Dev Technical Guidance**

* **Stripe:** Use stripe npm package.  
* **Security:** The Webhook route MUST verify the Stripe signature to prevent spoofing.  
* **Metadata:** Passing user\_id in the Stripe Session metadata is critical for the webhook to know who to credit.  
* **Env Vars:** Needs STRIPE\_SECRET\_KEY, STRIPE\_WEBHOOK\_SECRET, NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY.