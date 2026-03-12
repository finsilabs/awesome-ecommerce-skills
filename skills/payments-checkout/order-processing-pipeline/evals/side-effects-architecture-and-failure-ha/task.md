# Automated Order Fulfillment Actions

## Problem Description

An e-commerce platform currently triggers all post-status-change actions (sending emails, deducting inventory, notifying the 3PL provider, updating tracking information) inside the same database transaction as the status update itself. This is causing two serious issues: slow email delivery is rolling back order status updates, and a single failed notification is blocking the entire order from progressing.

The engineering team wants to redesign the system so that automated actions triggered by status changes are decoupled from the database transaction. The new design should run those actions after the status change is committed, and if any action fails it should be recorded for later retry rather than crashing the order update.

The `db` object (Prisma-like ORM) is available in scope for any database operations. The following helper functions can be assumed to exist and are importable from a `services/` directory: `sendOrderConfirmationEmail`, `deductInventory`, `notifyFulfillmentProvider`, `sendShippingConfirmationEmail`, `updateTrackingInformation`, `sendDeliveryConfirmationEmail`, `scheduleReviewRequest`, `releaseInventoryReservations`, `initiateRefundIfPaid`, `sendCancellationEmail`, `emitOrderWebhook`, and `transitionOrder` (which handles the DB update atomically).

## Output Specification

Produce a JavaScript module `lib/orderSideEffects.js` implementing the automated actions layer. It should include a `runTransitionSideEffects` function and a top-level orchestration function that callers can use to perform a complete order transition.

Also produce `design-notes.md` at the project root explaining: (a) which actions are triggered for each order status, (b) how failures are handled, and (c) why actions are placed outside the transaction.
