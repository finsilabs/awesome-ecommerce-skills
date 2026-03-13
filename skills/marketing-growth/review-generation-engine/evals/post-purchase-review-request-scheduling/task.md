# Post-Purchase Review Collection Automation

## Problem/Feature Description

A mid-sized e-commerce brand sells physical goods directly to consumers and wants to grow its product review volume without hiring a dedicated customer success team. They currently have zero automated outreach — reviews only come from customers who proactively seek out the form. The engineering team has a background job queue already running (BullMQ) and a basic order management system with delivery webhook support. They want to add systematic, multi-touch review request outreach that starts after each order is confirmed delivered and stops automatically as soon as a customer submits a review.

The head of growth has specifically asked that the solution not feel spammy — customers should get a first gentle nudge shortly after delivery, a light follow-up only if they haven't engaged, and one final ask with a meaningful incentive to capture photo reviews. The business also ships several hundred orders per week, so the team needs the approach to be queue-based, idempotent, and clean.

## Output Specification

Implement a TypeScript module called `review-scheduler.ts` that exports:
- A `scheduleReviewRequests(order: Order)` function that enqueues all outreach steps for a delivered order
- A `onReviewSubmitted(orderId: string)` function that cancels any remaining scheduled outreach for that order

Also write a short `DESIGN.md` documenting the timing of each step, the channel used for each step, and the rationale for when each step fires.

Use the following type definitions as a starting point (add whatever additional types you need):

```typescript
interface Order {
  id: string;
  customerId: string;
  lineItems: Array<{ productId: string }>;
}
```

You may assume a `reviewRequestQueue` BullMQ queue is available as an import. Do not implement the actual email/SMS sending logic — just the scheduling.
