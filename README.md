# Awesome E-Commerce Skills

> 17 curated e-commerce skills for AI coding assistants and commerce practitioners.

![Skills](https://img.shields.io/badge/skills-17-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

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

- **17 skills** across 17 categories
- Every skill evaluated with [Tessl](https://tessl.io) task evals (baseline vs with-skill comparison)
- Role-based bundles for quick onboarding
- Multi-step workflows for common e-commerce journeys
- Validation tooling and CI pipeline

## Top 10 Starter Skills

| Skill | Category | Description |
|-------|----------|-------------|
| `@product-data-modeling` | catalog-inventory | Schema design for products with variants, options, attributes, and relationships |
| `@stripe-integration` | payments-checkout | Stripe payment intents, subscriptions, webhooks, and SCA compliance |
| `@ecommerce-seo` | marketing-growth | Product page SEO, structured data (JSON-LD), canonical URLs, and sitemap generation |
| `@shipping-rate-calculator` | fulfillment-shipping | Real-time rate calculation with carrier APIs (UPS, FedEx, USPS, DHL) |
| `@customer-accounts` | customer-crm | Registration, profile management, address book, and order history |
| `@discount-engine` | pricing-promotions | Rule-based discount system — percentage, fixed, BOGO, tiered, conditional |
| `@product-page-design` | storefront-ui | High-converting product page layouts with image galleries, variant selectors, and social proof |

## Categories

| Category | Skills | Description |
|----------|--------|-------------|
| **Business Operations** `business-operations` | 1 | `@merchandising-rules` |
| **Catalog Inventory** `catalog-inventory` | 1 | `@product-data-modeling` |
| **Customer Crm** `customer-crm` | 1 | `@customer-accounts` |
| **Data Analytics** `data-analytics` | 1 | `@ecommerce-data-warehouse` |
| **Fulfillment Shipping** `fulfillment-shipping` | 1 | `@shipping-rate-calculator` |
| **Headless Modern** `headless-modern` | 1 | `@medusa-development` |
| **Infrastructure Performance** `infrastructure-performance` | 1 | `@ecommerce-caching` |
| **Integrations Apis** `integrations-apis` | 1 | `@erp-integration` |
| **Marketing Growth** `marketing-growth` | 1 | `@ecommerce-seo` |
| **Payments Checkout** `payments-checkout` | 1 | `@stripe-integration` |
| **Platform Magento** `platform-magento` | 1 | `@magento-module-development` |
| **Platform Salesforce Cc** `platform-salesforce-cc` | 1 | `@sfcc-cartridge-development` |
| **Platform Shopify** `platform-shopify` | 1 | `@shopify-theme-development` |
| **Platform Woocommerce** `platform-woocommerce` | 1 | `@woocommerce-plugin-development` |
| **Pricing Promotions** `pricing-promotions` | 1 | `@discount-engine` |
| **Security Compliance** `security-compliance` | 1 | `@pci-dss-compliance` |
| **Storefront Ui** `storefront-ui` | 1 | `@product-page-design` |

## Browse All Skills

See [CATALOG.md](CATALOG.md) for the full list of 17 skills with descriptions, tags, and eval scores.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```sh
# Validate your skill locally
npm run validate
```

## License

MIT
