---
name: gift-cards
description: "Sell and accept gift cards with secure code generation, real-time balance tracking, partial redemption support, and expiration enforcement"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [gift-cards, store-credit, balance, redemption, partial-use, issuance]
triggers: ["gift card", "store credit", "gift certificate", "gift card balance", "redeem gift card"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Gift Cards

## Overview

Implement digital gift card issuance, secure redemption with partial-use support, real-time balance tracking via an append-only ledger, and email delivery. Gift cards function as a form of store credit — a customer can pay part of an order with a gift card and the remainder with a payment method, with any unused balance remaining on the card.

## When to Use This Skill

- When adding gift cards as a purchasable product that customers can send to others
- When implementing store credit as a refund mechanism in place of cash refunds
- When building bulk corporate gift card programs for B2B clients
- When allowing customers to split payment between a gift card and a credit card at checkout
- When you need a full balance history for accounting reconciliation or customer support lookups

## Core Instructions

1. **Design the gift card schema using a ledger**

   ```sql
   CREATE TABLE gift_cards (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     code         VARCHAR(32) NOT NULL UNIQUE,
     initial_value INTEGER NOT NULL,   -- cents
     currency     VARCHAR(3) NOT NULL DEFAULT 'USD',
     issued_to    VARCHAR(255),        -- recipient email
     issued_by    UUID,                -- customer_id who purchased it; NULL = admin-issued
     order_id     UUID,                -- the purchase order that created this card
     is_active    BOOLEAN NOT NULL DEFAULT true,
     expires_at   TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE gift_card_transactions (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     card_id      UUID NOT NULL REFERENCES gift_cards(id),
     amount       INTEGER NOT NULL,    -- positive = credit (issuance/reload), negative = debit (redemption/refund)
     type         VARCHAR(16) NOT NULL
                    CHECK (type IN ('issue', 'redeem', 'reload', 'refund', 'void', 'expiration')),
     order_id     UUID,
     note         TEXT,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE UNIQUE INDEX idx_gift_cards_code ON gift_cards(UPPER(code));
   CREATE INDEX idx_gc_transactions_card ON gift_card_transactions(card_id, created_at DESC);
   ```

2. **Issue a gift card**

   ```typescript
   import crypto from 'crypto';

   function generateGiftCardCode(): string {
     // Format: XXXX-XXXX-XXXX-XXXX (16 alphanumeric chars, hyphen-separated)
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
     const raw = Array.from(crypto.randomBytes(16))
       .map(b => chars[b % chars.length])
       .join('');
     return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
   }

   async function issueGiftCard(params: {
     valueCents: number;
     currency?: string;
     recipientEmail: string;
     purchaserCustomerId?: string;
     purchaseOrderId?: string;
     expiresAt?: Date;
   }): Promise<GiftCard> {
     const code = generateGiftCardCode();

     return db.transaction(async tx => {
       const card = await tx.giftCards.insert({
         code,
         initial_value: params.valueCents,
         currency: params.currency ?? 'USD',
         issued_to: params.recipientEmail,
         issued_by: params.purchaserCustomerId ?? null,
         order_id: params.purchaseOrderId ?? null,
         expires_at: params.expiresAt ?? null,
       });

       await tx.giftCardTransactions.insert({
         card_id: card.id,
         amount: params.valueCents,
         type: 'issue',
         order_id: params.purchaseOrderId ?? null,
         note: `Gift card issued to ${params.recipientEmail}`,
       });

       return card;
     });
   }
   ```

3. **Get current balance**

   ```typescript
   async function getGiftCardBalance(code: string): Promise<{
     card: GiftCard;
     balanceCents: number;
   }> {
     const card = await db.giftCards.findByCode(code.toUpperCase().replace(/\s/g, ''));
     if (!card) throw new Error('GIFT_CARD_NOT_FOUND');
     if (!card.is_active) throw new Error('GIFT_CARD_INACTIVE');
     if (card.expires_at && card.expires_at < new Date()) throw new Error('GIFT_CARD_EXPIRED');

     const result = await db.raw(
       'SELECT COALESCE(SUM(amount), 0) AS balance FROM gift_card_transactions WHERE card_id = ?',
       [card.id]
     );
     const balanceCents = parseInt(result.rows[0].balance, 10);

     return { card, balanceCents: Math.max(0, balanceCents) };
   }
   ```

4. **Redeem a gift card at checkout (with partial-use support)**

   ```typescript
   interface GiftCardRedemptionResult {
     appliedCents: number;    // how much was deducted from the gift card
     remainingBalance: number;
     remainingOrderTotal: number;
   }

   async function redeemGiftCard(
     code: string,
     orderId: string,
     orderTotalCents: number
   ): Promise<GiftCardRedemptionResult> {
     return db.transaction(async tx => {
       // Lock the card row to prevent concurrent redemptions
       const card = await tx.raw(
         'SELECT * FROM gift_cards WHERE UPPER(code) = ? FOR UPDATE',
         [code.toUpperCase()]
       ).then(r => r.rows[0]);

       if (!card || !card.is_active) throw new Error('GIFT_CARD_NOT_FOUND_OR_INACTIVE');

       const balance = await getGiftCardBalance(code);
       const appliedCents = Math.min(balance.balanceCents, orderTotalCents);

       if (appliedCents === 0) throw new Error('GIFT_CARD_ZERO_BALANCE');

       await tx.giftCardTransactions.insert({
         card_id: card.id,
         amount: -appliedCents,   // debit
         type: 'redeem',
         order_id: orderId,
         note: `Applied to order ${orderId}`,
       });

       // If balance is fully depleted, mark as inactive for faster lookups
       if (appliedCents === balance.balanceCents) {
         await tx.giftCards.update(card.id, { is_active: false });
       }

       return {
         appliedCents,
         remainingBalance: balance.balanceCents - appliedCents,
         remainingOrderTotal: orderTotalCents - appliedCents,
       };
     });
   }
   ```

5. **Handle refunds back to gift card**

   ```typescript
   async function refundToGiftCard(
     code: string,
     orderId: string,
     refundCents: number
   ): Promise<void> {
     const card = await db.giftCards.findByCode(code.toUpperCase());
     if (!card) throw new Error('GIFT_CARD_NOT_FOUND');

     await db.transaction(async tx => {
       // Reactivate the card if it was marked inactive
       if (!card.is_active) {
         await tx.giftCards.update(card.id, { is_active: true });
       }

       await tx.giftCardTransactions.insert({
         card_id: card.id,
         amount: refundCents,    // positive = credit back
         type: 'refund',
         order_id: orderId,
         note: `Refund for order ${orderId}`,
       });
     });
   }
   ```

## Examples

### Send gift card email after issuance

```typescript
const card = await issueGiftCard({
  valueCents: 5000,              // $50.00
  recipientEmail: 'friend@example.com',
  purchaserCustomerId: 'cust_abc',
  purchaseOrderId: 'ord_xyz',
});

await emailService.send({
  to: card.issued_to,
  template: 'gift-card',
  data: {
    code: card.code,
    formattedValue: '$50.00',
    senderName: 'Your Friend',
    shopUrl: 'https://shop.example.com',
    expiresAt: card.expires_at ? card.expires_at.toLocaleDateString() : 'Never',
  },
});
```

### Split payment: $30 gift card + card for remaining $20

```typescript
const giftCardResult = await redeemGiftCard('ABCD-EFGH-IJKL-MNOP', orderId, 5000);
// giftCardResult.appliedCents = 3000 (card had $30 balance)
// giftCardResult.remainingOrderTotal = 2000

if (giftCardResult.remainingOrderTotal > 0) {
  // Charge the remainder to the stored payment method
  const paymentIntent = await stripe.paymentIntents.create({
    amount: giftCardResult.remainingOrderTotal,
    currency: 'usd',
    customer: stripeCustomerId,
    metadata: { order_id: orderId },
    automatic_payment_methods: { enabled: true },
  });
}
```

## Best Practices

- **Use an append-only ledger** — never update a balance column; record every debit and credit as a transaction row for a full audit trail
- **Lock the card row before redemption** — use `SELECT ... FOR UPDATE` to prevent two concurrent checkouts from each reading the same balance and both succeeding
- **Store card codes case-insensitively** — normalize codes to uppercase on write and compare uppercase on lookup (`UPPER(code)`)
- **Generate codes with no ambiguous characters** — omit `0`, `O`, `1`, `I` from the character set to prevent customer confusion when reading codes aloud or from email
- **Never expose full card codes in URLs or logs** — partial masking (`ABCD-xxxx-xxxx-MNOP`) is acceptable for display; full codes belong only in the issuance email and checkout input
- **Set accounting liabilities on issuance** — gift card balances are a liability until redeemed; integrate with your accounting system to record the deferred revenue correctly
- **Void unused cards after expiration** — run a daily job that inserts a negative `expiration` transaction to zero out balances on expired cards for accounting accuracy

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two simultaneous checkouts both succeed using the same card | Use `SELECT ... FOR UPDATE` (row-level lock) inside a database transaction before checking balance |
| Balance goes negative due to split payment rounding | Use `Math.min(balance, orderTotal)` — never apply more than the current balance |
| Customer can't find their card after a refund re-credits it | After refunding, set `is_active = true` even if the card was previously depleted and deactivated |
| Gift card codes appear in server access logs | Never include the code as a URL path parameter; use a POST body or a hashed lookup token |

## Related Skills

- @coupon-management
- @loyalty-points-system
- @stripe-integration
- @returns-management
- @checkout-flow-optimization
