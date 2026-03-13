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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Gift Cards

## Overview

Gift cards let customers purchase store credit to give as gifts or to use themselves. They function as a form of payment at checkout — a customer can pay part of an order with a gift card and the remainder with a credit card, and any unused balance stays on the card. All major e-commerce platforms include native gift card functionality; custom implementations are only needed for headless storefronts or very specific accounting requirements.

## When to Use This Skill

- When adding gift cards as a purchasable product that customers can send to others
- When implementing store credit as a refund mechanism in place of cash refunds
- When building bulk corporate gift card programs for B2B clients
- When allowing customers to split payment between a gift card and a credit card at checkout
- When you need a full balance history for accounting reconciliation or customer support

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommendation | Notes |
|----------|---------------|-------|
| **Shopify** | Use Shopify's built-in gift cards (available on all plans except Basic) | Native integration with checkout, balance tracking, and email delivery — no app needed |
| **WooCommerce** | WooCommerce Gift Cards plugin (official, ~$49/year) or YITH WooCommerce Gift Cards (~$80/year) | Core WooCommerce does not include gift cards; these plugins are well-maintained and widely used |
| **BigCommerce** | BigCommerce Gift Certificates (built in, all plans) | Native support — create, sell, and redeem gift certificates from the admin panel |
| **Custom / Headless** | Build with ledger-based balance tracking | See Custom section below |

### Step 2: Set up gift cards on your platform

---

#### Shopify

Shopify gift cards are available on Shopify, Advanced, and Plus plans (not Basic). They are issued as a product and redeemed at checkout using a 16-character code.

**Enable and create gift cards:**
1. In your Shopify admin, go to **Products → Gift cards**
2. Click **Add gift card product**
3. Set denominations (e.g., $25, $50, $100) — each denomination is a product variant
4. Add a title, description, and image for the gift card product
5. Click **Save**

**Issuing a gift card to a customer:**
- **Via sale**: When a customer purchases a gift card, Shopify automatically generates a unique code and emails it to the recipient
- **Manually**: Go to **Customers** → find the customer → **Gift cards** tab → **Issue gift card**; set the value and expiry date

**Setting expiry dates:**
1. In **Settings → Gift cards**
2. Enable gift card expiry and set the default expiration period
3. Note: Some jurisdictions prohibit gift card expiry (check local law before enabling)

**Bulk gift cards for B2B or marketing:**
1. Go to **Products → Gift cards → Export** to download existing codes
2. Use the Shopify Admin API (`POST /admin/api/2024-04/gift_cards.json`) to bulk-create gift cards programmatically
3. The API response includes the code — distribute via your email platform

**Store credit as a refund:**
When issuing a refund, Shopify allows you to refund to a gift card instead of the original payment method:
1. Go to **Orders** → open the order → **Refund**
2. Under "Refund to", select **Gift card** and specify the amount
3. Shopify creates a new gift card and emails the code to the customer

---

#### WooCommerce

Install the **WooCommerce Gift Cards** extension (from WooCommerce.com) or **YITH WooCommerce Gift Cards**. These are the most feature-complete options.

**Setup with WooCommerce Gift Cards:**
1. Install and activate the plugin
2. Go to **Products → Add New** and set the product type to **Gift card**
3. Under **Gift card data**:
   - Set delivery type: email delivery (for digital) or printed card
   - Set available amounts or allow custom amounts
   - Configure the email template that sends the code to the recipient
4. Publish the product

**Redemption:**
The plugin adds a "Gift card" field to the checkout page. Customers enter their code and the balance is deducted from the order total. Partial redemption is supported — remaining balance stays on the card.

**Store credit as refund:**
1. Open the order → **Refund**
2. The plugin adds a "Refund to gift card" option
3. A new gift card code is generated and emailed to the customer

**Balance inquiry:**
Both WooCommerce Gift Cards and YITH provide a balance inquiry shortcode you can add to a page: `[woo_gift_card_balance_check]`

---

#### BigCommerce

BigCommerce calls these "Gift Certificates" and includes them natively.

**Create and sell gift certificates:**
1. Go to **Marketing → Gift Certificates → Create Gift Certificate**
2. Fill in:
   - **To** (recipient name and email)
   - **From** (sender name and email)
   - **Amount**: fixed value
   - **Expiry date** (optional)
3. BigCommerce sends the certificate code to the recipient via email

**Selling gift certificates as a product:**
1. Go to **Products → Gift Certificates**
2. Enable the gift certificate product page
3. Customers can purchase certificates in custom or fixed amounts directly from your storefront

**Redemption:**
Gift certificate codes appear as a payment option at checkout. Partial redemption is supported — the remaining balance is saved on the certificate code.

---

#### Custom / Headless

For headless storefronts, implement a ledger-based gift card system. The ledger pattern records every debit and credit as an immutable transaction row — never update a balance column directly.

```sql
CREATE TABLE gift_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(32) NOT NULL UNIQUE,
  initial_value_cents INTEGER NOT NULL,
  currency     VARCHAR(3) NOT NULL DEFAULT 'USD',
  issued_to    VARCHAR(255),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gift_card_ledger (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID NOT NULL REFERENCES gift_cards(id),
  amount_cents INTEGER NOT NULL,  -- positive = credit, negative = debit
  type       VARCHAR(16) NOT NULL CHECK (type IN ('issue', 'redeem', 'refund', 'void')),
  order_id   UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Balance calculation** — always derived from the ledger, never from a stored column:

```typescript
async function getBalance(cardCode: string): Promise<number> {
  const card = await db.giftCards.findByCode(cardCode.toUpperCase());
  if (!card || !card.is_active) throw new Error('CARD_NOT_FOUND');
  if (card.expires_at && card.expires_at < new Date()) throw new Error('CARD_EXPIRED');

  const result = await db.raw(
    'SELECT COALESCE(SUM(amount_cents), 0) AS balance FROM gift_card_ledger WHERE card_id = ?',
    [card.id]
  );
  return Math.max(0, parseInt(result.rows[0].balance, 10));
}
```

**Partial redemption with row-level locking** to prevent concurrent over-redemption:

```typescript
async function redeemGiftCard(code: string, orderId: string, orderTotalCents: number) {
  return db.transaction(async tx => {
    // Lock the card row to prevent concurrent redemptions
    const card = await tx.raw(
      'SELECT * FROM gift_cards WHERE UPPER(code) = ? FOR UPDATE',
      [code.toUpperCase()]
    ).then(r => r.rows[0]);

    if (!card || !card.is_active) throw new Error('CARD_NOT_FOUND');

    const balance = await getBalance(code);
    const appliedCents = Math.min(balance, orderTotalCents);
    if (appliedCents === 0) throw new Error('ZERO_BALANCE');

    await tx.giftCardLedger.insert({
      card_id: card.id,
      amount_cents: -appliedCents,
      type: 'redeem',
      order_id: orderId,
    });

    return { appliedCents, remainingBalance: balance - appliedCents };
  });
}
```

## Best Practices

- **Use an append-only ledger** — never update a balance column; record every debit and credit as a transaction row for a full audit trail (required for accounting reconciliation)
- **Generate codes without ambiguous characters** — omit `0`, `O`, `1`, `I` from the character set to prevent customer confusion when reading codes from email
- **Never expose full card codes in URLs or logs** — partial masking (`ABCD-xxxx-xxxx-MNOP`) is safe for display; full codes belong only in the issuance email
- **Set accounting liabilities on issuance** — gift card balances are a deferred revenue liability until redeemed; ensure your accounting integration records this correctly
- **Check local regulations before setting expiry dates** — many US states and other jurisdictions restrict or prohibit gift card expiration; verify before enabling
- **Test the refund-to-gift-card flow** — this is a common customer service scenario; ensure the newly issued card is accessible and redeemable before going live

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two simultaneous checkouts both succeed using the same card | Use a row-level lock (`SELECT ... FOR UPDATE`) inside a database transaction before reading the balance (custom builds); platforms handle this natively |
| Balance goes negative due to rounding in split payment | Use `Math.min(balance, orderTotal)` — never apply more than the current balance |
| Customer cannot find their card after a refund re-credits it | After refunding to a gift card, ensure the card is reactivated if it was previously depleted and deactivated |
| Gift card codes appear in server access logs | Never include the code as a URL path parameter; use a POST body or a hashed lookup token |
| Gift card purchased but code not delivered | Platform-native gift cards send automatically; for custom implementations, use transactional email with delivery tracking and a resend option in your customer service panel |

## Related Skills

- @coupon-management
- @loyalty-points-system
- @stripe-integration
- @returns-management
- @checkout-flow-optimization
