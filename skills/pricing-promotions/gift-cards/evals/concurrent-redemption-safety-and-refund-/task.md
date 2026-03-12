# Gift Card Checkout Integration for BrightThreads

## Problem Description

BrightThreads is a fashion retailer that recently launched gift cards and is now rolling out the checkout integration. The team has run into two production issues they need your help resolving:

**Issue 1 — Race condition during flash sales:** During a recent flash sale, the same gift card was successfully applied to two different orders at nearly the same time, resulting in the card going negative. The current implementation reads the balance and then inserts the redemption transaction as two separate steps with no locking, allowing concurrent requests to both see the old balance before either debit is recorded.

**Issue 2 — Missing balance after refunds:** Several customers who received refunds back to their gift cards reported that their cards appeared to have zero balance in the UI even though a refund was issued. Investigation showed that when a card reaches zero balance the system marks it in a way that causes subsequent lookups to short-circuit and skip the balance calculation.

Your task is to implement the corrected `redeemGiftCard` and `refundToGiftCard` TypeScript functions. Customers should be able to apply a gift card even when it doesn't cover the full order total (the remainder should be charged to their other payment method), and refunds should always restore the correct spendable balance.

Assume the following are available as imports:
- `db` — a database client with `.transaction()`, `.raw(sql, params)`, `.giftCards.findByCode()`, `.giftCards.update()`, and `.giftCardTransactions.insert()` methods
- The `getGiftCardBalance(code)` helper is already implemented and returns `{ card, balanceCents }`

## Output Specification

Write a TypeScript file named `giftCardCheckout.ts` containing:
1. The `redeemGiftCard(code, orderId, orderTotalCents)` function — returns `{ appliedCents, remainingBalance, remainingOrderTotal }`
2. The `refundToGiftCard(code, orderId, refundCents)` function — returns `void`

Include any necessary TypeScript interfaces. The file should compile without errors assuming the `db` and `getGiftCardBalance` imports exist.
