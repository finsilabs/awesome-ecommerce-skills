# Awesome E-Commerce Skills

> A curated collection of 132 ready-to-use e-commerce skills that make AI coding assistants dramatically better at building online stores.

![Skills](https://img.shields.io/badge/skills-132-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

## What Are Skills?

Skills are expert instructions that teach AI assistants how to do specific e-commerce tasks well. Think of them as cheat sheets — when your AI assistant has the right skill loaded, it writes better code, follows best practices, and makes fewer mistakes.

**Without a skill**, an AI assistant gives you generic code that might miss critical details like webhook signature verification, idempotency handling, or PCI compliance requirements.

**With a skill**, the same assistant produces production-ready code that follows industry best practices.

We tested every skill with [Tessl](https://tessl.io) automated evaluations. On average, skills improve AI output quality from **68%** to **97%** — a **+29% improvement** across 131 skills.

**Works with:** Claude Code, Cursor, Gemini CLI, GitHub Copilot, Codex CLI, Kiro, OpenCode, and any AI assistant that supports context files.

## Table of Contents

- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Eval Results](#eval-results)
- [Top 10 Starter Skills](#top-10-starter-skills)
- [All Categories](#all-categories)
- [Curated Bundles](#curated-bundles)
- [Browse All Skills](#browse-all-skills)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Option 1: Via Tessl (recommended)

[Tessl](https://tessl.io) lets you install skills directly into your project with one command.

```sh
# Install the Tessl CLI
curl -fsSL https://get.tessl.io | sh

# Install any skill by name
tessl install finsi/stripe-integration
tessl install finsi/checkout-flow-optimization
```

### Option 2: Copy manually

```sh
# Clone this repository
git clone https://github.com/finsilabs/awesome-ecommerce-skills.git

# Copy any skill into your project's AI context folder
cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration/SKILL.md \
  your-project/.claude/skills/
```

That's it. Your AI assistant will automatically use the skill the next time you ask it to work on that topic.

## How It Works

```
You: "Add Stripe payments to my checkout"

AI without skill:              AI with skill:
  Generic Stripe example         Production-ready Payment Intents
  Missing webhook handling        Webhook signature verification
  No error recovery              Idempotent event processing
  Basic card form                SCA/3D Secure compliance
```

Each skill contains:
- **When to use it** — so you know which skill fits your situation
- **Step-by-step instructions** — that guide the AI through the implementation
- **Best practices** — drawn from real-world e-commerce experience
- **Common pitfalls** — things the AI would otherwise get wrong

## Eval Results

Every skill is tested using [Tessl](https://tessl.io) automated evaluations. Each eval gives an AI assistant a realistic e-commerce task, then scores the output against a detailed checklist. We run each task twice — once without the skill (baseline) and once with it — to measure the real improvement.

**Across 131 skills tested:**

| | Score |
|---|---|
| Without skills (baseline) | 68% |
| With skills | 97% |
| **Improvement** | **+29%** |

**Biggest improvements:**

| Skill | Without | With | Improvement |
|-------|---------|------|-------------|
| woocommerce-subscriptions | 31% | 100% | **+69%** |
| fraud-detection | 34% | 97% | **+63%** |
| low-stock-alerts | 36% | 98% | **+62%** |
| product-content-enrichment | 39% | 97% | **+58%** |
| customer-lifetime-value | 40% | 97% | **+57%** |
| referral-program | 47% | 100% | **+53%** |
| coupon-management | 49% | 100% | **+51%** |
| dropshipping-integration | 50% | 100% | **+50%** |
| search-autocomplete | 46% | 96% | **+50%** |
| dynamic-pricing | 44% | 93% | **+49%** |

## Top 10 Starter Skills

New to this? Start here. These are the most commonly needed skills for any e-commerce project.

| Skill | What It Does | Eval Score |
|-------|-------------|------------|
| **Checkout Flow Optimization** | Multi-step vs single-page checkout design with conversion best practices | 95% |
| **Product Data Modeling** | Schema design for products with variants, options, attributes, and relationships | 92% |
| **Stripe Integration** | Stripe payment intents, subscriptions, webhooks, and SCA compliance | 100% |
| **Ecommerce Seo** | Product page SEO, structured data (JSON-LD), canonical URLs, and sitemap generation | 96% |
| **Cart Logic** | Shopping cart state management — add/remove/update, persistence, merge strategies | 95% |
| **Inventory Tracking** | Real-time stock tracking across warehouses with reservation and backorder logic | 100% |
| **Shipping Rate Calculator** | Real-time rate calculation with carrier APIs (UPS, FedEx, USPS, DHL) | 90% |
| **Customer Accounts** | Registration, profile management, address book, and order history | 100% |
| **Discount Engine** | Rule-based discount system — percentage, fixed, BOGO, tiered, conditional | 89% |
| **Product Page Design** | High-converting product page layouts with image galleries, variant selectors, and social proof | 90% |

## All Categories

132 skills organized into 17 categories. Click any category to browse its skills.

| Category | Skills | Examples |
|----------|--------|----------|
| [**Business Operations**](skills/business-operations/) | 8 | B2b Commerce, Demand Forecasting, Marketplace Building, +5 more |
| [**Catalog Inventory**](skills/catalog-inventory/) | 10 | Catalog Import Export, Digital Products, Inventory Tracking, +7 more |
| [**Customer Crm**](skills/customer-crm/) | 9 | Customer Accounts, Customer Lifetime Value, Customer Segmentation, +6 more |
| [**Data Analytics**](skills/data-analytics/) | 6 | Ab Testing Ecommerce, Attribution Modeling, Customer Analytics, +3 more |
| [**Fulfillment Shipping**](skills/fulfillment-shipping/) | 8 | Dropshipping Integration, Free Shipping Thresholds, International Shipping, +5 more |
| [**Headless Modern**](skills/headless-modern/) | 8 | Commerce Api Gateway, Commerce Js Integration, Composable Commerce, +5 more |
| [**Infrastructure Performance**](skills/infrastructure-performance/) | 7 | Database Optimization Commerce, Ecommerce Caching, Edge Commerce, +4 more |
| [**Integrations Apis**](skills/integrations-apis/) | 7 | Analytics Integration, Email Service Integration, Erp Integration, +4 more |
| [**Marketing Growth**](skills/marketing-growth/) | 12 | Affiliate Program, Cart Abandonment Recovery, Content Commerce, +9 more |
| [**Payments Checkout**](skills/payments-checkout/) | 10 | Buy Now Pay Later, Cart Logic, Checkout Flow Optimization, +7 more |
| [**Platform Magento**](skills/platform-magento/) | 4 | Magento Graphql, Magento Indexing Caching, Magento Module Development, +1 more |
| [**Platform Salesforce Cc**](skills/platform-salesforce-cc/) | 3 | Sfcc Business Manager, Sfcc Cartridge Development, Sfcc Ocapi Scapi |
| [**Platform Shopify**](skills/platform-shopify/) | 7 | Shopify Admin Api, Shopify App Development, Shopify Checkout Extensions, +4 more |
| [**Platform Woocommerce**](skills/platform-woocommerce/) | 5 | Woocommerce Blocks, Woocommerce Performance, Woocommerce Plugin Development, +2 more |
| [**Pricing Promotions**](skills/pricing-promotions/) | 9 | Ab Testing Pricing, Coupon Management, Discount Engine, +6 more |
| [**Security Compliance**](skills/security-compliance/) | 7 | Account Security, Bot Protection, Data Retention Policies, +4 more |
| [**Storefront Ui**](skills/storefront-ui/) | 12 | Accessibility Commerce, Faceted Navigation, Image Zoom 360, +9 more |

## Curated Bundles

Don't know where to start? Pick a bundle based on your role. Each bundle is a recommended set of skills for a specific job.

| Bundle | What It's For | Skills |
|--------|--------------|--------|
| **Common** | Essential skills every e-commerce project needs | 15 skills |
| **Store Builder** | Everything to build a full online store from scratch | 41 skills |
| **Growth Marketer** | SEO, email, social, analytics, and conversion optimization | 25 skills |
| **Platform Migrator** | Tools for migrating between e-commerce platforms | 30 skills |
| **Security Ops** | PCI compliance, fraud detection, GDPR, and security hardening | 15 skills |
| **Headless Architect** | Build modern headless/composable commerce architectures | 20 skills |
| **B2b Specialist** | B2B features — bulk pricing, company accounts, ERP integration | 14 skills |
| **Marketplace Builder** | Multi-vendor marketplace with seller management and payouts | 20 skills |

See [bundles.json](data/bundles.json) for the full skill lists in each bundle.

## Browse All Skills

See [CATALOG.md](CATALOG.md) for the complete list of all 132 skills with descriptions, tags, and evaluation scores.

## Contributing

We welcome contributions! Whether you want to improve an existing skill or add a new one:

1. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Check out the [skill template](docs/contributors/skill-template.md) to get started
3. Run `npm run validate` to check your skill before submitting

## License

MIT
