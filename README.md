# Awesome E-Commerce Skills

<p align="center">
  <img src="docs/assets/hero.svg" alt="Awesome E-Commerce Skills — 178 practical workflow guides for Shopify, WooCommerce, and BigCommerce" width="100%"/>
</p>

> A curated collection of 178 ready-to-use e-commerce skills that make AI assistants dramatically better at helping you run and grow your online store.

![Skills](https://img.shields.io/badge/skills-178-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

## What Are Skills?

Skills are expert instructions that teach AI assistants how to help you with specific e-commerce tasks. Think of them as cheat sheets — when your AI assistant has the right skill loaded, it gives you better advice, recommends the right apps and tools for your platform, and walks you through setup step by step.

**Without a skill**, an AI assistant gives you generic advice that may not work for your platform or suggests building everything from scratch.

**With a skill**, the same assistant knows which Shopify app to install, which WooCommerce plugin to configure, and walks you through the exact settings — only suggesting custom code when you actually need it.

We tested every skill with [Tessl](https://tessl.io) automated evaluations. On average, skills improve AI output quality from **66%** to **96%** — a **+31% improvement** across 177 skills.

**Works with:** Claude Code, Cursor, Gemini CLI, GitHub Copilot, Codex CLI, Kiro, OpenCode, and any AI assistant that supports context files.

## Table of Contents

- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Works With Your Platform](#works-with-your-platform)
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
You: "Set up abandoned cart recovery for my Shopify store"

AI without skill:                    AI with skill:
  Writes a custom Node.js cron job     Knows Shopify has built-in recovery emails
  Builds an email queue from scratch   Recommends Klaviyo for multi-step flows
  Ignores your existing platform       Configures the right triggers and timing
  Misses SMS opt-in compliance         Includes SMS consent and TCPA compliance
```

Each skill contains:
- **Platform-specific guidance** — recommends the right apps, plugins, and built-in features for Shopify, WooCommerce, BigCommerce, and custom setups
- **Step-by-step setup instructions** — with real navigation paths like "Go to Settings → Checkout → Abandoned checkouts"
- **Best practices** — drawn from real-world e-commerce experience
- **Common pitfalls** — mistakes to avoid on each platform

## Works With Your Platform

Every skill includes setup instructions for the platforms merchants actually use. No assumptions about custom code — skills recommend the right tool for your platform first.

### Shopify

Skills teach your AI which Shopify apps and built-in features to use — and how to configure them:

```
You: "Add a loyalty points system to my Shopify store"

AI + loyalty-points-system skill:
  → Compares Smile.io vs Yotpo Loyalty for your use case
  → Explains how to set up point-earning rules and redemption tiers
  → Shows where to add the rewards widget in your theme
  → Covers VIP tier configuration and points expiration
```

We also have 7 **Shopify-specific skills** covering the Admin API, Storefront API, theme development, checkout extensions, webhooks, metafields, and app development.

### WooCommerce

Skills know which WordPress plugins solve each problem and how to configure them:

```
You: "Set up subscription billing for my WooCommerce store"

AI + subscription-billing skill:
  → Compares WooCommerce Subscriptions ($199/yr) vs SUMO Subscriptions
  → Explains subscription product setup and billing intervals
  → Covers failed payment retry rules and dunning
  → Shows how to add subscriber management to My Account
```

We have 5 **WooCommerce-specific skills** for plugin development, Blocks, REST API, subscriptions, and performance.

### BigCommerce

Skills cover BigCommerce's built-in features and app marketplace:

```
You: "Add product reviews to my BigCommerce store"

AI + product-reviews-ratings skill:
  → Explains when built-in reviews are enough vs when to use Yotpo/Stamped
  → Covers review request email setup after purchase
  → Shows how to enable Google Rich Snippets for review stars in search
  → Explains moderation settings and review approval workflows
```

### Headless / Custom Platforms

For headless setups (Next.js, Remix, etc.), skills provide actual code — but still recommend SaaS tools (Klaviyo API, Stripe Checkout) over building everything from scratch:

```
You: "Add Stripe payments to my headless store"

AI + stripe-integration skill:
  → Explains why Stripe Checkout (hosted) is better than custom forms for PCI
  → Provides Payment Intents API code with SCA/3D Secure compliance
  → Includes webhook handler code for order fulfillment
  → Covers Stripe Tax setup for automatic tax calculation
```

We have 8 **headless-specific skills** covering Shopify Hydrogen, Medusa, Saleor, Commerce.js, JAMstack, and PWA storefronts.

### Also Supported: Magento (4 skills) and Salesforce Commerce Cloud (3 skills)

> **How does this actually work?** You copy a skill file into your project (or install via `tessl install`). Your AI assistant reads it automatically — no configuration needed. The next time you ask it to help with that topic, it follows the skill's platform-specific instructions instead of guessing. The skill tells it which apps to recommend, what settings to configure, and what mistakes to avoid for your specific platform.

## Eval Results

Every skill is tested using [Tessl](https://tessl.io) automated evaluations. Each eval gives an AI assistant a realistic e-commerce task, then scores the output against a detailed checklist. We run each task twice — once without the skill (baseline) and once with it — to measure the real improvement.

**Across 177 skills tested:**

| | Score |
|---|---|
| Without skills (baseline) | 66% |
| With skills | 96% |
| **Improvement** | **+31%** |

**Biggest improvements:**

| Skill | Without | With | Improvement |
|-------|---------|------|-------------|
| win-back-reactivation | 13% | 91% | **+78%** |
| woocommerce-subscriptions | 31% | 100% | **+69%** |
| fraud-detection | 34% | 100% | **+66%** |
| low-stock-alerts | 36% | 98% | **+62%** |
| ecommerce-budgeting-forecasting | 39% | 100% | **+61%** |
| product-content-enrichment | 39% | 98% | **+59%** |
| marketplace-advertising | 39% | 97% | **+58%** |
| customer-lifetime-value | 40% | 97% | **+57%** |
| accounts-receivable-automation | 43% | 100% | **+57%** |
| ugc-campaign-management | 40% | 96% | **+56%** |

## Top 10 Starter Skills

New to this? Start here. These are the most commonly needed skills for any e-commerce project.

| Skill | What It Does | Eval Score |
|-------|-------------|------------|
| **[Checkout Flow Optimization](skills/payments-checkout/checkout-flow-optimization/)** | Reduce cart abandonment with optimized checkout — address autocomplete, smart field ordering, progress indicators, and guest checkout | 94% |
| **[Product Data Modeling](skills/catalog-inventory/product-data-modeling/)** | Structure your product catalog using your platform's native data model for variants, attributes, metafields, and product relationships | 95% |
| **[Stripe Integration](skills/payments-checkout/stripe-integration/)** | Set up Stripe payments — Shopify Payments, WooCommerce Stripe plugin, or custom Payment Intents with SCA compliance | 100% |
| **[E-commerce SEO](skills/marketing-growth/ecommerce-seo/)** | Maximize organic search traffic with optimized product page meta tags, JSON-LD structured data, and automated XML sitemaps | 97% |
| **[Cart Abandonment Recovery](skills/marketing-growth/cart-abandonment-recovery/)** | Win back abandoned carts with timed email/SMS sequences using Klaviyo, AutomateWoo, or your platform's built-in tools | 93% |
| **[Inventory Tracking](skills/catalog-inventory/inventory-tracking/)** | Track stock levels in real time with inventory reservation, low-stock alerts, and multi-location support | 100% |
| **[Shipping Rate Calculator](skills/fulfillment-shipping/shipping-rate-calculator/)** | Show real-time shipping rates at checkout using Shopify Shipping, Easyship, ShipperHQ, or carrier APIs | 98% |
| **[Customer Accounts](skills/customer-crm/customer-accounts/)** | Set up customer registration, profiles, saved addresses, and order history using your platform's built-in account system | 100% |
| **[Discount Engine](skills/pricing-promotions/discount-engine/)** | Create discounts — percentage off, fixed amounts, BOGO, tiered thresholds — using your platform's native discount system | 91% |
| **[Product Reviews](skills/customer-crm/product-reviews-ratings/)** | Add product reviews with Judge.me, Yotpo, or Stamped — includes review request emails and Google Rich Snippets | 95% |

## All Categories

178 skills organized into 17 categories. Click any category to browse its skills.

| Category | Skills | Examples |
|----------|--------|----------|
| [**Business Operations**](skills/business-operations/) | 9 | Accounts Payable, B2B Commerce, Demand Forecasting, +6 more |
| [**Catalog & Inventory**](skills/catalog-inventory/) | 11 | Catalog Import/Export, COGS Tracking, Digital Products, +8 more |
| [**Customer & CRM**](skills/customer-crm/) | 9 | Customer Accounts, Lifetime Value, Segmentation, +6 more |
| [**Data & Analytics**](skills/data-analytics/) | 16 | A/B Testing, Attribution Modeling, Cash Flow Forecasting, +13 more |
| [**Fulfillment & Shipping**](skills/fulfillment-shipping/) | 8 | Dropshipping, Free Shipping Thresholds, International Shipping, +5 more |
| [**Headless & Modern**](skills/headless-modern/) | 8 | Commerce API Gateway, Commerce.js, Composable Commerce, +5 more |
| [**Infrastructure & Performance**](skills/infrastructure-performance/) | 7 | Database Optimization, Caching, Edge Commerce, +4 more |
| [**Integrations & APIs**](skills/integrations-apis/) | 7 | Analytics, Email Service, ERP Integration, +4 more |
| [**Marketing & Growth**](skills/marketing-growth/) | 36 | Affiliate Program, Cart Abandonment Recovery, Email Marketing, +33 more |
| [**Payments & Checkout**](skills/payments-checkout/) | 18 | Stripe, PayPal, Buy Now Pay Later, Subscriptions, +14 more |
| [**Magento**](skills/platform-magento/) | 4 | GraphQL, Indexing & Caching, Module Development, +1 more |
| [**Salesforce Commerce Cloud**](skills/platform-salesforce-cc/) | 3 | Business Manager, Cartridge Development, OCAPI/SCAPI |
| [**Shopify**](skills/platform-shopify/) | 7 | Admin API, App Development, Checkout Extensions, +4 more |
| [**WooCommerce**](skills/platform-woocommerce/) | 5 | Blocks, Performance, Plugin Development, +2 more |
| [**Pricing & Promotions**](skills/pricing-promotions/) | 9 | A/B Testing Pricing, Coupons, Discount Engine, +6 more |
| [**Security & Compliance**](skills/security-compliance/) | 9 | Account Security, Bot Protection, Fraud Detection, +6 more |
| [**Storefront & UI**](skills/storefront-ui/) | 12 | Accessibility, Faceted Navigation, Product Page Design, +9 more |

## Curated Bundles

Don't know where to start? Pick a bundle based on your role.

| Bundle | What It's For | Skills |
|--------|--------------|--------|
| **Common** | Essential skills every e-commerce project needs | 15 skills |
| **Store Builder** | Everything to build a full online store from scratch | 41 skills |
| **Growth Marketer** | SEO, email, social, analytics, and conversion optimization | 25 skills |
| **Platform Migrator** | Tools for migrating between e-commerce platforms | 30 skills |
| **Security Ops** | PCI compliance, fraud detection, GDPR, and security hardening | 15 skills |
| **Headless Architect** | Build modern headless/composable commerce architectures | 20 skills |
| **B2B Specialist** | B2B features — bulk pricing, company accounts, ERP integration | 14 skills |
| **Marketplace Builder** | Multi-vendor marketplace with seller management and payouts | 20 skills |

See [bundles.json](data/bundles.json) for the full skill lists in each bundle.

## Browse All Skills

See [CATALOG.md](CATALOG.md) for the complete list of all 178 skills with descriptions, tags, and evaluation scores.

## Contributing

We welcome contributions! Whether you want to improve an existing skill or add a new one:

1. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Check out the [skill template](docs/contributors/skill-template.md) to get started
3. Run `npm run validate` to check your skill before submitting

## Built by Finsi

This project is maintained by the team behind [Finsi OS](https://finsi.ai) — an AI-powered operating system for e-commerce brands. Finsi connects your entire stack (ads, email, retention, profitability), analyzes what matters, and acts on it automatically. If these skills help your AI assistant give better advice, Finsi takes it further by running your growth operations end-to-end.

[Start a free 30-day pilot →](https://finsi.ai)

## License

MIT
