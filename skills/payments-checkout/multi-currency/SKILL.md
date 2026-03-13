---
name: multi-currency
description: "Let international shoppers browse and pay in their local currency with automatic detection, live exchange rates, and locale-specific price formatting"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [multi-currency, forex, localization, exchange-rates, formatting, i18n, checkout]
triggers: ["multi currency", "currency conversion", "international pricing", "exchange rate", "currency selector", "localize prices"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Multi-Currency

## Overview

Multi-currency support lets international shoppers browse and pay in their local currency instead of your store's base currency. On Shopify, WooCommerce, and BigCommerce, this is a configuration task — each platform has built-in or app-based solutions that handle exchange rates, price display, and payment settlement automatically. Custom code is only required for headless storefronts.

## When to Use This Skill

- When expanding to international markets where shoppers expect prices in their local currency
- When analytics show significant traffic from non-base-currency countries with low conversion rates
- When implementing a currency selector in the site header
- When integrating Stripe or PayPal multi-currency settlement

## Core Instructions

### Step 1: Determine your platform and multi-currency approach

| Platform | Recommended Approach | Settlement Currency |
|----------|---------------------|---------------------|
| **Shopify (Shopify Payments)** | Enable **Markets** and multi-currency in Shopify Admin | Stripe/Shopify settles in your payout currency; conversion is automatic |
| **Shopify + non-Shopify gateway** | Install **BEST Currency Converter** or **MLV Auto Currency Switcher** app | Display-only conversion; payment taken in base currency |
| **WooCommerce** | Install **WooCommerce Payments** (for native multi-currency) or **WPML + WooCommerce Multilingual** | WooCommerce Payments settles in local currency; other gateways may convert |
| **BigCommerce** | Enable **Multi-Currency** in Store Settings; use Stripe for multi-currency settlement | BigCommerce handles display; Stripe settles in customer's currency |
| **Custom / Headless** | Use Stripe's multi-currency payment intents; fetch exchange rates from OpenExchangeRates | Stripe accepts charges in any currency and settles in your configured currency |

### Step 2: Set up multi-currency on your platform

---

#### Shopify

Shopify's **Markets** feature is the recommended way to implement multi-currency:

1. Go to **Settings → Markets**
2. Click **Add market** for each region (e.g., Europe, UK, Australia)
3. Under each market, go to **Currencies** and enable the local currency (EUR, GBP, AUD)
4. Shopify automatically converts prices using daily exchange rates
5. To set manual price overrides for specific currencies (e.g., set EUR price to a fixed €99 instead of converting $99.00), go to the market and click **Manage** to set currency-specific prices per product

**Exchange rate handling:**
- By default, Shopify uses automatic exchange rates that update daily
- To add a margin to the exchange rate (to cover your FX costs), go to **Settings → Markets → [Market] → Currencies** and set a currency conversion rate adjustment (e.g., +2%)

**Currency selector in storefront:**
Shopify themes from OS 2.0 (Dawn, Crave, etc.) include a built-in currency/country selector. In **Online Store → Themes → Customize**, add the **Header → Country/Region selector** section.

**Payment settlement:**
When using Shopify Payments, charges are made in the customer's currency. The payout to your bank account is in your default payout currency with Shopify handling the conversion. For Shopify Plus, you can configure multi-currency payouts with separate bank accounts per currency.

#### WooCommerce

**Option A: WooCommerce Payments (native multi-currency)**

1. Install and activate **WooCommerce Payments** (Stripe-powered)
2. Go to **WooCommerce → Settings → WooCommerce Payments → Multi-currency**
3. Click **Add currencies** and select the currencies you want to offer
4. For each currency, configure: exchange rate source (automatic from WooCommerce's daily feed or manual), rounding (e.g., round to .99), and whether to charge a conversion rate markup
5. Enable **Currency switcher widget**: go to **Appearance → Widgets** and add the **Currency Switcher** widget to your header or sidebar

**Option B: WooCommerce Multilingual + WPML**

1. Install **WPML** and **WooCommerce Multilingual & Multicurrency**
2. Go to **WPML → WooCommerce Multilingual → Currencies** and add currencies
3. For each currency, set the exchange rate (manual or via automatic update) and rounding rules
4. The product price for each currency can be set manually per product or auto-converted

**Option C: Currency Switcher for WooCommerce (free plugin)**

For display-only currency switching (payment taken in base currency), install **Currency Switcher for WooCommerce** by Aelia. This converts displayed prices but settles in your base currency — simpler but requires customers to understand they will be charged in USD (or your base currency).

#### BigCommerce

1. Go to **Settings → Store Setup → Currencies**
2. Click **Add a currency** and select from the dropdown
3. For each currency, configure:
   - **Exchange rate**: manual or auto-updated via BigCommerce's rate feed
   - **Rounding**: round to nearest 0.99, 0.95, or whole number
   - **Display settings**: where to show the currency selector
4. Set one currency as **Default** — this is used in reporting and as the fallback
5. Enable the currency selector: go to **Storefront → My Themes → Customize** and add the currency selector component to your header

**Payment settlement with BigCommerce:**
Configure your payment gateway to accept charges in multiple currencies. Stripe (configured under **Settings → Payments → Stripe**) supports accepting payments in the customer's currency and settling in yours automatically.

---

#### Custom / Headless

**Exchange rate fetching:**

```javascript
// Fetch and cache daily exchange rates from OpenExchangeRates (free tier available)
async function getExchangeRates() {
  const cached = await redis.get('exchange_rates');
  if (cached) return JSON.parse(cached);

  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${process.env.OER_API_KEY}&base=USD&symbols=EUR,GBP,CAD,AUD,JPY`
  );
  const { rates } = await res.json();

  // Cache for 24 hours — daily rates are sufficient for display prices
  await redis.setex('exchange_rates', 86400, JSON.stringify(rates));
  return rates;
}

async function convertPrice(amountUSD, targetCurrency) {
  if (targetCurrency === 'USD') return amountUSD;
  const rates = await getExchangeRates();
  return amountUSD * rates[targetCurrency];
}
```

**Stripe multi-currency charge:**

```javascript
// Charge in customer's currency — Stripe handles conversion and settles in your payout currency
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(displayPrice * 100), // Amount in smallest unit (EUR cents, JPY yen)
  currency: customerCurrency.toLowerCase(), // 'eur', 'gbp', 'jpy'
  automatic_payment_methods: { enabled: true },
  metadata: { order_id: orderId, base_currency_amount: String(basePriceUSD) },
});
// Note: for JPY and other zero-decimal currencies, multiply by 1 (not 100)
const jpy_amount = Math.round(jpyPrice); // ¥3,000 → 3000, not 300000
```

**Currency detection from browser:**

```javascript
// Detect preferred currency from browser language or IP country header
function detectCurrency(req) {
  // Check explicit user preference first
  if (req.cookies.preferred_currency) return req.cookies.preferred_currency;

  // Cloudflare and similar CDNs provide the visitor's country
  const country = req.headers['cf-ipcountry'];
  const countryToCurrency = { US:'USD', GB:'GBP', DE:'EUR', FR:'EUR', AU:'AUD', JP:'JPY', CA:'CAD' };
  return countryToCurrency[country] ?? 'USD';
}
```

### Step 3: Verify correct behavior

Test these scenarios before going live:

1. **Correct price display**: visit from a VPN with a UK IP — prices should show in GBP
2. **JPY zero-decimal**: Japanese prices should show as whole numbers (¥3,000 not ¥30.00)
3. **Payment amount matches displayed price**: the Stripe charge amount must match what was shown
4. **Currency selector persists**: switching currency should persist across page navigation
5. **Cart totals in correct currency**: cart and checkout should use the selected currency

## Best Practices

- **Use platform-native multi-currency** — Shopify Markets, WooCommerce Payments, and BigCommerce's built-in feature handle exchange rates, rounding, and display correctly
- **Refresh exchange rates daily** — for display prices, daily rates are sufficient; do not fetch rates on every page load
- **Store order amounts in your base currency** — always record prices in your base currency in the database for consistent reporting; store the display currency and rate used for reference
- **Apply rounding rules specific to each market** — €9.99 looks natural; €9.847 does not; configure rounding in your platform's currency settings
- **Test JPY specifically** — JPY has zero decimal places; a common bug is displaying ¥29.99 instead of ¥3,000; verify by setting your test currency to JPY

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Prices flash to base currency on page load | Read the user's currency preference server-side (from a cookie) and render with the correct currency on first load; avoid client-side-only currency switching |
| JPY amount passed to Stripe as cents | For zero-decimal currencies (JPY, KRW), pass the whole amount — ¥3,000 → `amount: 3000`, not `amount: 300000` |
| Payment amount does not match displayed price | Recalculate the payment amount server-side using the stored exchange rate at checkout time; never trust client-submitted amounts |
| Exchange rate missing for a currency | Default to base currency or show an error; do not silently use a zero rate which would make products free |
| Shopify currency showing but not accepted at checkout | Currency must be enabled under **Settings → Payments → Supported currencies** in addition to **Settings → Markets**; both settings must be configured |

## Related Skills

- @checkout-flow-optimization
- @tax-calculation
- @stripe-integration
- @paypal-integration
