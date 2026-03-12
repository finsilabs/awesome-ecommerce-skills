# SaaS Subscription Signup with Free Trial

## Problem/Feature Description

Luminary, a B2B project management SaaS, is launching a new "Pro" tier. The growth team wants to offer a 14-day free trial to reduce signup friction — no credit card charge until the trial ends, but they do want to collect payment details upfront so that billing is automatic when the trial expires. The hosted checkout experience needs to feel polished without the engineering team building a custom UI.

The existing backend has a customer creation flow: when a user registers, a Stripe customer object is created and the `customerId` is stored in the database. The Pro tier pricing is already configured in Stripe with a monthly price ID of `price_pro_monthly`. The backend team wants to implement the subscription creation in Node.js and use Stripe's hosted checkout to collect payment details and start the trial. After the user completes checkout, they should land on a success page, and if they abandon checkout, they should return to the pricing page.

## Output Specification

Produce a Node.js file called `subscription-checkout.js` that exports two functions:

1. `createSubscriptionCheckout(customerId, orderId)` — Creates a Stripe Checkout Session for the Pro subscription with a 14-day trial and returns the session URL for redirect

2. `createDirectSubscription(customerId)` — Creates a Stripe Subscription directly (without hosted checkout) using the same price and trial period, returning the subscription object

Include comments explaining important parameter choices.

Assume the following constants are defined at the top of your file:
- `YOUR_DOMAIN` = `'https://app.luminary.io'`
- The Pro monthly price ID is `'price_pro_monthly'`
