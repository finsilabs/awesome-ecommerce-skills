# Wire Up Post-Payment Digital Goods Delivery

## Problem Description

A growing online marketplace has recently added digital products (e-books, software bundles) alongside their existing physical goods catalogue. The engineering team has wired up Stripe for payments, but the post-payment delivery of digital goods hasn't been implemented yet. Customers complete checkout and their payment goes through, but they never receive their download links or license keys — leading to a wave of support tickets.

The backend is Node.js with a Prisma ORM (`db`). The Stripe webhook infrastructure is already in place: the `webhookRouter` receives Stripe events and dispatches them to handler functions. The existing order structure looks like this:

```js
// order → items → variant → digitalProduct (may be null for physical items)
// digitalProduct fields: id, downloadLimit (int|null), accessDurationDays (int|null), type ('file'|'license_key')
```

The `orderDigitalAccess` table stores per-order entitlements. The `digitalProductLicenses` table holds license keys. An `emailService.send({ to, template, data })` function is available for sending emails.

There is a known problem: the payment provider occasionally fires the same webhook event more than once. The team was burned by a previous bug where duplicate processing sent customers two copies of an order confirmation, so they are particularly sensitive to any double-processing issues.

A second concern from the product team: customers have previously complained about license keys appearing in the standard order confirmation email, which they then accidentally forwarded to colleagues. The team wants digital delivery handled through a different communication channel.

## Output Specification

Implement the provisioning logic in `lib/provisionDigitalAccess.js`, exporting an async function `provisionDigitalAccess(orderId)`.

Implement (or update) the Stripe webhook handler file `webhooks/stripe.js` to call `provisionDigitalAccess` at the correct point in the payment lifecycle. The file should export a `handleStripeWebhook(event)` function.

Implement the delivery email helper in `lib/digitalDeliveryEmail.js`, exporting `sendDigitalDeliveryEmail(order, digitalItems)`.

Add comments in `provisionDigitalAccess.js` explaining how re-entrancy / duplicate events are handled.
