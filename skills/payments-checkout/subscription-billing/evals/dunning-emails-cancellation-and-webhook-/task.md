# Failed Payment Recovery and Subscription Cancellation

## Problem/Feature Description

A subscription e-commerce company is losing roughly 8% of its monthly revenue to involuntary churn — subscriptions lapsing because payment methods expired or had insufficient funds. At the same time, their webhook handler is sending duplicate recovery emails when Stripe re-delivers webhook events, which is angering customers and damaging their sender reputation.

The engineering team needs to build two things: (1) a robust `invoice.payment_failed` webhook handler that sends appropriately escalating recovery emails without ever sending duplicates, and (2) a cancellation endpoint that records why customers are leaving and makes a last-ditch attempt to retain them.

The company wants the emails to match customer urgency: a gentle first notice, a more urgent second attempt, and a final warning — with each email containing enough context and actionable information for the customer to resolve the issue quickly. The cancellation flow should preserve the customer's access until the end of their paid period (unless they specifically request immediate termination), and attempt to win them back with an offer email.

## Output Specification

Write the following files:

1. `api/webhooks/subscription-events.js` — exports `handleSubscriptionEvents(event)` that handles at minimum:
   - `invoice.payment_failed` — sends escalating dunning email, safely (no duplicates)
   - `customer.subscription.deleted` — marks subscription canceled in DB and revokes access

2. `api/subscriptions/cancel.js` — exports `async function cancelSubscription(req, res)` accepting:
   ```json
   { "subscriptionId": "...", "immediately": false, "reason": "too_expensive" }
   ```

3. `IMPLEMENTATION_NOTES.md` explaining:
   - The dunning email escalation logic and how duplicate sends are prevented
   - How cancellation timing works (immediate vs. period-end)
   - How the winback offer fits into the cancellation flow
