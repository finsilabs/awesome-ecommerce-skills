# Abandoned Cart Cleanup and Safe Order Cancellation

## Problem/Feature Description

A home-goods marketplace has been seeing a growing problem: customers browse during peak hours, add items to their cart, then leave without checking out. Because the platform optimistically reserves inventory when items are added to the cart, a significant portion of available stock is being held hostage by abandoned sessions. During a recent weekend sale, roughly 18% of reserved units belonged to carts that had not been touched in over an hour — units that could have been sold to other customers.

The team also discovered a related bug: when an order was cancelled after a payment failure, a race condition in the cancellation webhook occasionally triggered the release call twice. The second call was then decrementing the reserved counter below zero, causing subtle inventory corruption that only showed up in end-of-day reconciliation reports.

The team needs two things: (1) a `releaseReservation` function that is safe to call multiple times for the same cart/order without corrupting inventory, and (2) a background job that periodically reclaims inventory from carts that customers have clearly abandoned.

## Output Specification

Write the implementation as a JavaScript/TypeScript module at `lib/inventory.js` (or `.ts`). Export:
- `releaseReservation({ variantId, locationId, quantity, referenceId })` — releases inventory held by a cart or order
- `expireStaleCartReservations()` — scans for abandoned carts and releases their inventory

Also write a `jobs/expireCartReservations.js` (or equivalent) file that imports and schedules `expireStaleCartReservations` to run on a recurring basis.

Produce a short `DESIGN.md` explaining the approach taken to make release safe against duplicate calls and how the expiry cutoff is computed.
