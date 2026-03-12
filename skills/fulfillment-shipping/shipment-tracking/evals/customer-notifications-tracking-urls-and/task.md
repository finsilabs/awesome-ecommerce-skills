# Post-Purchase Shipping Notifications

## Problem/Feature Description

An e-commerce company's customer service team is overwhelmed with "where is my order?" tickets. The engineering team wants to build a notification system that proactively emails customers as their packages hit key milestones in the delivery journey. The support team also reports that when packages are lost or delivery fails, they find out from the customer rather than from an automated alert — which delays resolution by hours.

The backend already receives normalized tracking events (with fields: `trackingNumber`, `carrier`, `status`, `occurredAt`). The team needs a TypeScript module that, given a normalized tracking event and an order ID, sends the appropriate customer email and (when things go wrong) fires an internal alert. The system should not send duplicate emails if the same status fires more than once for the same order — this has happened before due to carrier retransmissions.

## Output Specification

Produce a TypeScript file `notification-service.ts` that exports:

- A `sendTrackingNotification(orderId: string, event: NormalizedTrackingEvent)` function
- A `buildTrackingUrl(carrier: string, trackingNumber: string)` function

Use stub objects for `db`, `emailService`, and `slackService` (define them as simple constants — no real implementation needed) so the logic is fully self-contained and reviewable.

Also produce `notification-design.md` that documents which statuses trigger customer emails, which trigger internal alerts, and how duplicate notifications are prevented.
