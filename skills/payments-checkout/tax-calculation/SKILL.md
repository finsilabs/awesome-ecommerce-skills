---
name: tax-calculation
description: "Calculate accurate sales tax and VAT at checkout using TaxJar or Avalara, with nexus management for multi-state and international compliance"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [tax, vat, nexus, taxjar, avalara, compliance, checkout, international]
triggers: ["tax calculation", "sales tax", "VAT", "TaxJar integration", "Avalara integration", "tax nexus", "international tax"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Tax Calculation

## Overview

Accurate tax calculation at checkout is a legal requirement, not an optimization. In the United States, there are over 13,000 taxing jurisdictions. EU VAT rules require charging the customer's local VAT rate. Getting it wrong leads to under-collection (a liability you must cover) or over-collection (refunds and customer complaints). All major platforms have built-in tax calculation or direct integrations with TaxJar and Avalara that handle this correctly without custom code.

## When to Use This Skill

- When expanding sales to states or countries where you have tax nexus obligations
- When manual tax rates are causing compliance issues or needing constant updates
- When implementing EU VAT compliance (OSS/IOSS registration)
- When displaying accurate tax before the customer confirms payment

## Core Instructions

### Step 1: Understand nexus before configuring tax

You only need to collect tax in jurisdictions where you have **nexus** (a tax obligation).

**US Sales Tax nexus:**
- **Physical nexus**: you have employees, warehouses, or offices in a state
- **Economic nexus**: most states trigger at $100,000/year in sales OR 200 transactions to customers in that state (California and Texas use $500,000)
- Check each state's current threshold before configuring — thresholds change

**EU VAT:**
- EU-based sellers must charge VAT at the customer's country rate for all EU sales
- Non-EU sellers must register for EU VAT (via OSS scheme) once annual EU B2C sales exceed €10,000
- B2B sales within the EU: reverse charge applies — the buyer handles VAT via self-assessment

### Step 2: Set up tax calculation on your platform

---

#### Shopify

**Option A: Shopify's built-in tax (recommended for US stores)**

1. Go to **Settings → Taxes and duties**
2. Under **Tax regions**, select the regions where you have nexus
3. For US: Shopify calculates taxes automatically at the correct state + county + city rate based on the customer's shipping address — no third-party service needed for basic US compliance
4. Enable **Charge tax on shipping** if your state requires it (varies by state)
5. For product-level exemptions (e.g., clothing exempt in PA): go to **Products → [Product] → Tax** and set the appropriate tax category or create a custom tax override

**Option B: Stripe Tax (via Shopify + Stripe)**

Shopify's built-in tax covers US well. For international VAT compliance, install **Stripe Tax** via a Shopify app integration.

**Option C: TaxJar or Avalara (for complex multi-jurisdiction requirements)**

1. Install **TaxJar** or **Avalara AvaTax** from the Shopify App Store
2. Follow the app's setup wizard: connect to your Shopify store, enter your nexus states, and configure product tax categories
3. The app replaces Shopify's built-in tax calculation with its own real-time calculation at checkout
4. Committed transactions are automatically sent to TaxJar/Avalara for filing reports

#### WooCommerce

**Option A: WooCommerce built-in tax**

1. Go to **WooCommerce → Settings → Tax** and enable tax calculation
2. Set your store base address (this affects which rates apply)
3. Go to **Tax → Standard rates** and manually enter rates per state/country
4. **Limitation**: manual rates are not updated automatically; for compliance, use TaxJar or Avalara

**Option B: TaxJar (recommended for US compliance)**

1. Sign up at **taxjar.com** and get your API token
2. Install **TaxJar for WooCommerce** plugin (free, from WordPress.org)
3. Go to **WooCommerce → TaxJar** and enter your API token
4. Enable **Automatic tax calculation** — TaxJar calculates the correct rate at checkout in real-time based on your nexus states and the customer's address
5. Enable **Transaction sync** — completed orders are automatically sent to TaxJar for filing reports

**Option C: Avalara AvaTax**

1. Sign up at **avalara.com** and create a company in AvaTax
2. Install the **Avalara AvaTax for WooCommerce** plugin
3. Enter your Account ID, License Key, and Company Code from the Avalara dashboard
4. Enable calculation and transaction recording

#### BigCommerce

1. Go to **Store Setup → Tax**
2. BigCommerce has a built-in tax calculation for basic US rates
3. For full compliance: go to **Store Setup → Tax → Tax Provider** and connect **Avalara AvaTax** or **TaxJar**
4. Follow the provider's BigCommerce setup guide — both have native integrations that replace the built-in tax engine with real-time compliant calculations

**EU VAT on BigCommerce:**
Enable **VAT by country** under **Store Setup → Tax → VAT** for EU VAT compliance. For full OSS compliance, use Avalara's EU VAT module.

---

#### Custom / Headless

Use **Stripe Tax** (simplest) or the TaxJar/Avalara API directly:

**Option A: Stripe Tax (recommended for Stripe-based stores)**

```javascript
// Enable Stripe Tax on the PaymentIntent — Stripe calculates and collects tax automatically
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderSubtotalCents, // Subtotal only — Stripe adds tax
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
  // Stripe Tax configuration
  // See: https://stripe.com/docs/tax/integration
});

// Or use Stripe Checkout with automatic_tax enabled:
const session = await stripe.checkout.sessions.create({
  line_items: lineItems,
  mode: 'payment',
  automatic_tax: { enabled: true }, // Stripe Tax handles calculation
  customer_details: { address: { country: customerCountry }, address_source: 'shipping' },
  success_url: `${domain}/success`,
  cancel_url: `${domain}/cart`,
});
```

Configure Stripe Tax under **Stripe Dashboard → Tax → Configure** — set your tax registration numbers and the tax behaviors for each product category.

**Option B: TaxJar API**

```javascript
const Taxjar = require('taxjar');
const taxjar = new Taxjar({ apiKey: process.env.TAXJAR_API_KEY });

async function calculateTaxForOrder({ fromAddress, toAddress, lineItems, shippingCost }) {
  const response = await taxjar.taxForOrder({
    from_country: fromAddress.country,
    from_zip: fromAddress.zip,
    from_state: fromAddress.state,
    to_country: toAddress.country,
    to_zip: toAddress.zip,
    to_state: toAddress.state,
    to_city: toAddress.city,
    amount: lineItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    shipping: shippingCost,
    line_items: lineItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_tax_code: item.tax_code ?? null, // e.g., '20010' for general goods
    })),
  });

  return {
    totalTax: response.tax.amount_to_collect,
    taxRate: response.tax.rate,
    hasNexus: response.tax.has_nexus, // false = no tax to collect
    breakdown: response.tax.breakdown,
  };
}

// After order is confirmed, commit the transaction for filing reports
async function commitTaxTransaction(order) {
  await taxjar.createOrder({
    transaction_id: order.id,
    transaction_date: new Date().toISOString().split('T')[0],
    from_country: WAREHOUSE_ADDRESS.country,
    from_zip: WAREHOUSE_ADDRESS.zip,
    from_state: WAREHOUSE_ADDRESS.state,
    to_country: order.shippingAddress.country,
    to_zip: order.shippingAddress.zip,
    to_state: order.shippingAddress.state,
    amount: order.subtotal,
    shipping: order.shippingCost,
    sales_tax: order.taxAmount,
    line_items: order.lineItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      sales_tax: item.taxAmount,
    })),
  });
}
```

**EU VAT reverse charge (B2B cross-border within EU):**

For EU B2B transactions, validate the buyer's VAT number via the EU VIES service before applying zero-rate:

```javascript
async function validateEUVATNumber(vatNumber) {
  const countryCode = vatNumber.slice(0, 2);
  const number = vatNumber.slice(2);
  const res = await fetch(
    `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${number}`
  );
  const data = await res.json();
  return data.isValid === true;
}
```

### Step 3: Commit tax transactions after order completion

Tax calculation services require you to "commit" each transaction after payment is confirmed — this records it in your filing reports. TaxJar and Avalara apps for Shopify/WooCommerce do this automatically. For custom integrations, call the create/commit API after the order is confirmed (not before payment).

## Best Practices

- **Never hard-code tax rates** — rates change constantly; use TaxJar, Avalara, Stripe Tax, or your platform's built-in tax engine
- **Calculate tax in real-time at checkout** — display the exact tax amount before the customer confirms payment; estimated tax that changes at payment causes distrust and cart abandonment
- **Commit transactions after payment, not before** — only committed transactions appear in filing reports; commit when the payment is confirmed
- **Void tax transactions on refunds** — when you issue a refund, void the corresponding tax transaction in TaxJar/Avalara to avoid over-reporting on your filing
- **Handle tax API errors gracefully** — if the tax API is unavailable, apply a fallback rate (US average ~8.5%) rather than blocking checkout

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Tax calculated but not committed to the filing API | Ensure your platform integration (TaxJar plugin, Avalara plugin) is configured to auto-commit on order completion; verify in the provider's transaction dashboard |
| EU VAT charged on B2B cross-border sales | Validate VAT numbers via VIES before applying reverse charge; if validation fails, charge VAT as B2C |
| Tax API adds 500ms to checkout | TaxJar and Avalara both have caching built into their Shopify/WooCommerce plugins; for custom builds, cache estimates by destination zip code and cart total for 1 hour |
| Shopify charging wrong tax rate for a state | Verify your nexus state list in Settings → Taxes is correct and up to date; check for product-level tax overrides that may be incorrectly configured |
| WooCommerce showing "0 tax" after TaxJar install | Verify TaxJar API key is correct; check the plugin's status page for API errors; confirm your warehouse address and nexus states are configured in the TaxJar dashboard |

## Related Skills

- @checkout-flow-optimization
- @multi-currency
- @order-processing-pipeline
- @stripe-integration
- @tax-compliance-automation
