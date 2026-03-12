# Fraud Review Workflow Implementation

## Problem/Feature Description

A luxury goods retailer processes high-value orders online and needs a robust workflow to handle transactions that a risk-scoring system has flagged as suspicious. In the current system, flagged orders are sometimes accidentally fulfilled before a fraud analyst can inspect them, and on at least two occasions, a payment was captured on an order that later turned out to be fraudulent — resulting in a costly chargeback.

The operations team wants a well-defined server-side workflow for what happens when an order is flagged: the order should be held, the payment should be secured but not settled, the fraud review team should be immediately notified through their existing communication channel, and there should be a safety valve that automatically cleans up orders that nobody reviewed within a reasonable window. The team is also concerned about leaking internal fraud logic to bad actors — they've heard that sophisticated fraudsters will deliberately trigger errors to probe detection thresholds.

## Output Specification

Produce a TypeScript file named `fraud-review.ts` that exports:
- A `flagForManualReview(orderId: string, riskScore: number, signals: object, stripe: any, db: any): Promise<void>` function
- A `expireUnreviewedOrders(stripe: any, db: any): Promise<void>` function (intended to be called by a cron job)

Also produce a `checkout-error-handler.ts` file that demonstrates how the checkout API should respond to the client when an order is blocked or held for review (i.e., what the HTTP error response looks like).

Write a `design-notes.md` explaining the rationale for the payment handling strategy chosen for flagged orders.
