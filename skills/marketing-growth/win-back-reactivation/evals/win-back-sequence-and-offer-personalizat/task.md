# Automated Win-Back Campaign Engine

## Problem Description

A DTC (direct-to-consumer) brand has identified several thousand customers across different lapsed segments and wants to automatically enroll each of them in a targeted re-engagement campaign. The marketing team has found through past experiments that simply blasting all lapsed customers with the same coupon code results in low conversion and erodes brand trust. They want a smarter approach: tailoring both the offer given and the product recommendations shown based on each customer's purchase history, and rolling out the outreach in a considered sequence rather than all at once.

A key concern is duplicate enrollments — customers must not be re-enrolled in a campaign if they were already targeted recently. The team also wants to ensure incentives are earned and meaningful: discounts should be valid for a limited window and non-transferable, and the opening message should focus on reconnection rather than an immediate push to buy.

## Output Specification

Write a TypeScript file `win-back-engine.ts` that implements:
1. `selectWinBackOffer(customerId, offerStrength)` — returns the appropriate offer based on the customer's purchase history
2. `getWinBackRecommendations(customerId)` — returns personalized product suggestions
3. `triggerWinBackSequence(customerId, segment)` — orchestrates the full campaign enrollment including deduplication, offer creation, product recommendations, and job scheduling

Assume the following are available via imports:
- `db` from `'./db'`
- `winBackQueue` from `'./queue'`
- `createUniqueDiscount` from `'./discounts'`
- `subDays`, `addDays` from `'date-fns'`
- Types `Customer`, `Product`, `LapsedSegment` from `'./types'`

Do not implement database or queue internals — just the campaign orchestration logic.
