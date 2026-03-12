---
name: multi-currency
description: "Currency detection, conversion, rounding rules, and localized formatting"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [multi-currency, forex, localization, exchange-rates, formatting, i18n, checkout]
triggers: ["multi currency", "currency conversion", "international pricing", "exchange rate", "currency selector", "localize prices"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Multi-Currency

## Overview

Implement multi-currency support that detects a visitor's preferred currency from their locale or IP geolocation, converts product prices using live or daily exchange rates, applies currency-specific rounding rules, and formats amounts with correct symbols, decimal separators, and digit groupings. Payments can be settled in the presentment currency (via Stripe multi-currency) or converted back to the store's base currency at settlement.

## When to Use This Skill

- When expanding to international markets where shoppers expect prices in their local currency
- When analytics show significant traffic from non-base-currency countries with low conversion rates
- When implementing a currency selector in the site header
- When integrating Stripe or PayPal multi-currency settlement

## Core Instructions

1. **Define supported currencies and exchange rate strategy**

   ```javascript
   // config/currencies.js
   export const SUPPORTED_CURRENCIES = {
     USD: { symbol: '$',  code: 'USD', decimalDigits: 2, thousandsSep: ',', decimalSep: '.', symbolFirst: true },
     EUR: { symbol: '€',  code: 'EUR', decimalDigits: 2, thousandsSep: '.', decimalSep: ',', symbolFirst: false },
     GBP: { symbol: '£',  code: 'GBP', decimalDigits: 2, thousandsSep: ',', decimalSep: '.', symbolFirst: true },
     CAD: { symbol: '$',  code: 'CAD', decimalDigits: 2, thousandsSep: ',', decimalSep: '.', symbolFirst: true,  label: 'CA$' },
     AUD: { symbol: '$',  code: 'AUD', decimalDigits: 2, thousandsSep: ',', decimalSep: '.', symbolFirst: true,  label: 'AU$' },
     JPY: { symbol: '¥',  code: 'JPY', decimalDigits: 0, thousandsSep: ',', decimalSep: '.', symbolFirst: true },
     BRL: { symbol: 'R$', code: 'BRL', decimalDigits: 2, thousandsSep: '.', decimalSep: ',', symbolFirst: true },
   };

   export const BASE_CURRENCY = 'USD';
   ```

2. **Fetch and cache exchange rates**

   Use a daily exchange rate snapshot for display prices; use real-time rates for payment processing.

   ```javascript
   // lib/exchangeRates.js
   import { redis } from './redis';

   const RATES_CACHE_KEY = 'exchange_rates';
   const RATES_TTL_SECONDS = 60 * 60 * 24; // 24 hours for display prices

   export async function getExchangeRates() {
     const cached = await redis.get(RATES_CACHE_KEY);
     if (cached) return JSON.parse(cached);

     // Fetch from Open Exchange Rates, Fixer.io, or a similar API
     const res = await fetch(
       `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPENEXCHANGERATES_API_KEY}&base=USD&symbols=EUR,GBP,CAD,AUD,JPY,BRL`
     );
     const data = await res.json();

     const rates = data.rates; // { EUR: 0.93, GBP: 0.79, ... }
     await redis.setex(RATES_CACHE_KEY, RATES_TTL_SECONDS, JSON.stringify(rates));
     return rates;
   }

   export async function convertPrice(amountUSD, targetCurrency) {
     if (targetCurrency === BASE_CURRENCY) return amountUSD;
     const rates = await getExchangeRates();
     const rate = rates[targetCurrency];
     if (!rate) throw new Error(`Unsupported currency: ${targetCurrency}`);
     return amountUSD * rate;
   }
   ```

3. **Apply currency-specific rounding rules**

   Converted prices look odd without rounding (e.g., €23.847). Apply "charming price" rounding.

   ```javascript
   // lib/currencyRounding.js

   export function roundPrice(amount, currency) {
     const config = SUPPORTED_CURRENCIES[currency];
     if (!config) return amount;

     if (config.decimalDigits === 0) {
       // JPY, KRW — round to nearest integer
       return Math.round(amount);
     }

     // Apply psychological pricing rounding
     // Prices < $10: round to .99
     // Prices >= $10: round to nearest .00 or .95

     if (amount < 10) {
       return Math.floor(amount) + 0.99;
     }

     if (amount < 100) {
       // Round to nearest 5-cent increment ending in .95 or .99
       const rounded = Math.round(amount * 20) / 20; // Round to nearest $0.05
       return rounded % 1 === 0 ? rounded - 0.05 : rounded;
     }

     // For amounts >= 100, round to nearest whole number
     return Math.round(amount);
   }
   ```

4. **Format prices for display using the Intl API**

   The browser's `Intl.NumberFormat` handles all locale-specific formatting concerns correctly.

   ```javascript
   // lib/formatCurrency.js

   /**
    * Format a price amount for display.
    * Uses Intl.NumberFormat for locale-aware formatting.
    *
    * @param {number} amount - The price amount
    * @param {string} currency - ISO 4217 currency code
    * @param {string} locale - BCP 47 locale tag (e.g., 'en-US', 'de-DE')
    * @returns {string} Formatted price string
    */
   export function formatPrice(amount, currency, locale = 'en-US') {
     const config = SUPPORTED_CURRENCIES[currency];
     if (!config) return `${currency} ${amount}`;

     try {
       return new Intl.NumberFormat(locale, {
         style: 'currency',
         currency,
         minimumFractionDigits: config.decimalDigits,
         maximumFractionDigits: config.decimalDigits,
       }).format(amount);
     } catch {
       // Fallback for unsupported environments
       return `${config.label ?? config.symbol}${amount.toFixed(config.decimalDigits)}`;
     }
   }

   // Examples:
   // formatPrice(29.99, 'USD', 'en-US') → '$29.99'
   // formatPrice(29.99, 'EUR', 'de-DE') → '29,99 €'
   // formatPrice(3500, 'JPY', 'ja-JP')  → '¥3,500'
   // formatPrice(29.99, 'BRL', 'pt-BR') → 'R$ 29,99'
   ```

5. **Detect and persist currency from browser/IP geolocation**

   ```javascript
   // middleware/currencyDetection.js

   const COUNTRY_TO_CURRENCY = {
     US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', JP: 'JPY', BR: 'BRL',
     DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
     // Add more as needed
   };

   export async function detectCurrency(req, res, next) {
     // 1. Explicit user selection (highest priority)
     if (req.cookies.preferred_currency && SUPPORTED_CURRENCIES[req.cookies.preferred_currency]) {
       req.currency = req.cookies.preferred_currency;
       return next();
     }

     // 2. Accept-Language header hint
     const acceptLanguage = req.headers['accept-language'] ?? '';
     const localeMatch = acceptLanguage.match(/([a-z]{2})-([A-Z]{2})/);
     if (localeMatch) {
       const country = localeMatch[2];
       const currency = COUNTRY_TO_CURRENCY[country];
       if (currency && SUPPORTED_CURRENCIES[currency]) {
         req.currency = currency;
         return next();
       }
     }

     // 3. IP geolocation (if Cloudflare or similar CDN provides cf-ipcountry header)
     const countryCode = req.headers['cf-ipcountry'] ?? req.headers['x-country'];
     if (countryCode) {
       const currency = COUNTRY_TO_CURRENCY[countryCode];
       if (currency && SUPPORTED_CURRENCIES[currency]) {
         req.currency = currency;
         return next();
       }
     }

     // 4. Default to base currency
     req.currency = BASE_CURRENCY;
     next();
   }

   // Currency selector — user explicitly chooses
   // POST /api/preferences/currency
   export async function setCurrencyPreference(req, res) {
     const { currency } = req.body;
     if (!SUPPORTED_CURRENCIES[currency]) {
       return res.status(400).json({ error: 'Unsupported currency' });
     }
     res.cookie('preferred_currency', currency, {
       maxAge: 365 * 24 * 60 * 60 * 1000,
       httpOnly: true,
       sameSite: 'lax',
     });
     res.json({ currency });
   }
   ```

## Examples

### Currency selector component

```jsx
function CurrencySelector({ currentCurrency, supportedCurrencies }) {
  async function handleChange(e) {
    await fetch('/api/preferences/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: e.target.value }),
    });
    window.location.reload(); // Reload to re-render prices in new currency
  }

  return (
    <label className="currency-selector">
      <span className="sr-only">Select currency</span>
      <select value={currentCurrency} onChange={handleChange}>
        {Object.entries(supportedCurrencies).map(([code, config]) => (
          <option key={code} value={code}>
            {config.label ?? config.symbol} {code}
          </option>
        ))}
      </select>
    </label>
  );
}
```

### Stripe multi-currency charge

```javascript
// Charge in the customer's currency — Stripe handles conversion and settlement
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(displayPrice * 100),  // Amount in smallest currency unit
  currency: customerCurrency.toLowerCase(), // 'eur', 'gbp', etc.
  automatic_payment_methods: { enabled: true },
  metadata: { order_id: orderId, base_currency_amount: String(basePriceUSD) },
});
// Stripe converts to your settlement currency automatically
```

## Best Practices

- **Use the Intl.NumberFormat API** — never manually build currency strings; the Intl API handles 100+ locale/currency combinations correctly
- **Refresh exchange rates daily** — for display prices, daily rates are sufficient and reduce API costs; do not fetch rates on every page load
- **Store amounts in the base currency in the database** — always persist prices in your base currency (USD); store the display currency and rate used at checkout for reconciliation
- **Use Stripe's presentment currency feature** — Stripe can accept payments in the customer's currency and settle in yours; this is far simpler than building your own conversion
- **Apply rounding rules specific to each market** — €9.99 looks natural; €9.847 does not; apply charm pricing rules per currency
- **Test with JPY** — JPY has zero decimal places; a common bug is displaying ¥29.99 instead of ¥3,000

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Prices look odd after conversion (€23.847) | Apply the `roundPrice` function to converted prices before display and storage |
| Currency flashes to base currency on page load (hydration mismatch) | Read the user's currency preference from a cookie server-side and render with the correct currency from the first render |
| Payment amount does not match displayed price | Always recalculate the payment amount server-side using the same exchange rate that was shown to the customer; store the rate at checkout time |
| JPY amount passed to Stripe as cents (¥300000 instead of ¥3000) | For zero-decimal currencies (JPY, KRW), pass the whole amount to Stripe — do not multiply by 100 |
| Exchange rate missing for a currency | Default to base currency or show an error; do not silently use a zero rate which would make products free |

## Related Skills

- @checkout-flow-optimization
- @tax-calculation
- @stripe-integration
- @paypal-integration
