# Implement a Price Change Safety Layer

## Problem/Feature Description

RetailCore operates a large marketplace with tens of thousands of SKUs. They recently launched an algorithmic pricing engine that has been running for two weeks, but the ops team is alarmed by several incidents: some products swung 40% in a single hour, a few SKUs entered a rapid oscillation cycle where the price kept toggling between two values every 30 minutes, and — most embarrassingly — the engine overwrote the manually configured sale prices during last Friday's flash promotion, confusing customers who saw the advertised discount disappear at checkout.

The engineering team has been asked to build a safety and guardrails layer that wraps the raw pricing recommendations before they are applied to the catalog. This layer must prevent runaway repricing while still allowing the engine to make meaningful adjustments. It also needs to handle the human oversight workflow: large price movements should not be auto-applied but instead queued for a human reviewer to approve or reject.

## Output Specification

Produce a TypeScript file `price-guardrails.ts` that implements the safety layer as a function (or class) accepting a raw pricing decision and the current product record, and returning either an approved decision (possibly adjusted), a queued-for-review record, or a no-op if the change should be suppressed.

Also produce a `price-guardrails.test.ts` file with test cases covering at minimum: a change that exceeds the single-run cap, a change that requires human review, a change on a price-locked product, a product that was last changed too recently, and a change within normal bounds. Print results to stdout.

## Input Files

The following starter file provides the data types you should build upon. Extract it before beginning.

=============== FILE: inputs/types.ts ===============
export interface PricingDecision {
  productId: string;
  recommendedPrice: number;   // cents
  previousPrice: number;      // cents
  changeReason: string;
  confidenceScore: number;
  effectiveAt: Date;
}

export interface ProductRecord {
  id: string;
  price: number;              // cents, current catalog price
  costPrice: number;          // cents
  lastPricedAt: Date | null;  // when the engine last changed this product's price
  isPriceLocked: boolean;     // true when a promotion or manual override is active
  hasActivePromotion: boolean;
}

export interface ReviewQueueEntry {
  decision: PricingDecision;
  status: 'pending_review';
  queuedAt: Date;
}
