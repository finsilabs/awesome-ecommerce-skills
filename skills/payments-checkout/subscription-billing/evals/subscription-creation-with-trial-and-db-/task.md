# New SaaS Subscription Sign-Up Endpoint

## Problem/Feature Description

A B2B SaaS company is launching a new project management tool. They currently collect payment details on a sign-up form using Stripe Elements (which gives them a `paymentMethodId`) and want to offer new customers a 14-day free trial before their first charge. After the trial, customers are billed monthly.

The engineering team needs a backend API endpoint that handles the full subscription creation flow: looking up or creating a Stripe customer, attaching the provided payment method, and creating the Stripe subscription. The endpoint must return enough information for the frontend to handle any additional payment authentication steps (e.g., 3D Secure).

Critically, the subscription data must be stored in the company's own PostgreSQL database immediately after being created in Stripe, so that the rest of the application can check subscription status without making live calls to Stripe on every request.

## Output Specification

Write the subscription creation endpoint as a JavaScript file at `api/subscriptions/create.js`. The file should export an `async function createSubscription(req, res)` that accepts the following JSON body:

```json
{
  "planId": "price_xxx",
  "paymentMethodId": "pm_xxx",
  "email": "user@example.com",
  "trialDays": 14
}
```

Also write a short `IMPLEMENTATION_NOTES.md` explaining the key architectural decisions made in your implementation, specifically: how the Stripe subscription is configured, what is stored in the database, and what is returned to the frontend.
