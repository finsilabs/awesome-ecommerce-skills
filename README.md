# Awesome E-Commerce Skills

> 132 curated e-commerce skills for AI coding assistants and commerce practitioners.

![Skills](https://img.shields.io/badge/skills-132-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

**Compatible with:** Claude Code | Cursor | Gemini CLI | Copilot | Codex CLI | Kiro | OpenCode

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [What's Inside](#whats-inside)
- [Project Structure](#project-structure)
- [Top 10 Starter Skills](#top-10-starter-skills)
- [Curated Bundles](#curated-bundles)
- [Workflows](#workflows)
- [Categories](#categories)
- [Browse All Skills](#browse-all-skills)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

1. Clone this repo
2. Copy skills you need into your project's context
3. Invoke with `@skill-name` in your AI assistant

## Installation

**Via Tessl (recommended):**

```sh
# Install the Tessl CLI
curl -fsSL https://get.tessl.io | sh

# Install individual skills
tessl install awesome-ecommerce/stripe-integration
tessl install awesome-ecommerce/checkout-flow-optimization
```

**Manual:**

```sh
git clone https://github.com/YOUR_USERNAME/awesome-ecommerce-skills.git
cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration .claude/skills/
```

## What's Inside

- **132 skills** across 17 categories
- Every skill evaluated with [Tessl](https://tessl.io) task evals (baseline vs with-skill comparison)
- Role-based bundles for quick onboarding
- Multi-step workflows for common e-commerce journeys
- Validation tooling and CI pipeline

## Top 10 Starter Skills

| Skill | Category | Description |
|-------|----------|-------------|
| `@checkout-flow-optimization` | payments-checkout | Multi-step vs single-page checkout design with conversion best practices |
| `@product-data-modeling` | catalog-inventory | Schema design for products with variants, options, attributes, and relationships |
| `@stripe-integration` | payments-checkout | Stripe payment intents, subscriptions, webhooks, and SCA compliance |
| `@ecommerce-seo` | marketing-growth | Product page SEO, structured data (JSON-LD), canonical URLs, and sitemap generation |
| `@cart-logic` | payments-checkout | Shopping cart state management — add/remove/update, persistence, merge strategies |
| `@inventory-tracking` | catalog-inventory | Real-time stock tracking across warehouses with reservation and backorder logic |
| `@shipping-rate-calculator` | fulfillment-shipping | Real-time rate calculation with carrier APIs (UPS, FedEx, USPS, DHL) |
| `@customer-accounts` | customer-crm | Registration, profile management, address book, and order history |
| `@discount-engine` | pricing-promotions | Rule-based discount system — percentage, fixed, BOGO, tiered, conditional |
| `@product-page-design` | storefront-ui | High-converting product page layouts with image galleries, variant selectors, and social proof |

## Categories

| Category | Skills | Description |
|----------|--------|-------------|
| **Business Operations** `business-operations` | 8 | `@b2b-commerce`, `@demand-forecasting`, `@marketplace-building`, ... |
| **Catalog Inventory** `catalog-inventory` | 10 | `@catalog-import-export`, `@digital-products`, `@inventory-tracking`, ... |
| **Customer Crm** `customer-crm` | 9 | `@customer-accounts`, `@customer-lifetime-value`, `@customer-segmentation`, ... |
| **Data Analytics** `data-analytics` | 6 | `@ab-testing-ecommerce`, `@attribution-modeling`, `@customer-analytics`, ... |
| **Fulfillment Shipping** `fulfillment-shipping` | 8 | `@dropshipping-integration`, `@free-shipping-thresholds`, `@international-shipping`, ... |
| **Headless Modern** `headless-modern` | 8 | `@commerce-api-gateway`, `@commerce-js-integration`, `@composable-commerce`, ... |
| **Infrastructure Performance** `infrastructure-performance` | 7 | `@database-optimization-commerce`, `@ecommerce-caching`, `@edge-commerce`, ... |
| **Integrations Apis** `integrations-apis` | 7 | `@analytics-integration`, `@email-service-integration`, `@erp-integration`, ... |
| **Marketing Growth** `marketing-growth` | 12 | `@affiliate-program`, `@cart-abandonment-recovery`, `@content-commerce`, ... |
| **Payments Checkout** `payments-checkout` | 10 | `@buy-now-pay-later`, `@cart-logic`, `@checkout-flow-optimization`, ... |
| **Platform Magento** `platform-magento` | 4 | `@magento-graphql`, `@magento-indexing-caching`, `@magento-module-development`, ... |
| **Platform Salesforce Cc** `platform-salesforce-cc` | 3 | `@sfcc-business-manager`, `@sfcc-cartridge-development`, `@sfcc-ocapi-scapi` |
| **Platform Shopify** `platform-shopify` | 7 | `@shopify-admin-api`, `@shopify-app-development`, `@shopify-checkout-extensions`, ... |
| **Platform Woocommerce** `platform-woocommerce` | 5 | `@woocommerce-blocks`, `@woocommerce-performance`, `@woocommerce-plugin-development`, ... |
| **Pricing Promotions** `pricing-promotions` | 9 | `@ab-testing-pricing`, `@coupon-management`, `@discount-engine`, ... |
| **Security Compliance** `security-compliance` | 7 | `@account-security`, `@bot-protection`, `@data-retention-policies`, ... |
| **Storefront Ui** `storefront-ui` | 12 | `@accessibility-commerce`, `@faceted-navigation`, `@image-zoom-360`, ... |

## Browse All Skills

See [CATALOG.md](CATALOG.md) for the full list of 132 skills with descriptions, tags, and eval scores.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```sh
# Validate your skill locally
npm run validate
```

## License

MIT
