# Awesome E-Commerce Skills

> A curated collection of 178 ready-to-use e-commerce skills that make AI coding assistants dramatically better at building online stores.

![Skills](https://img.shields.io/badge/skills-178-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

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
| **Checkout Flow Optimization** | Design a high-converting checkout with address autocomplete, smart field ordering, progress indicators, and minimal friction to reduce abandonment | 95% |
| **Product Data Modeling** | Design a flexible product database schema that supports variants, custom attributes, product relationships, and category hierarchies | 92% |
| **Stripe Integration** | Build secure payment flows with Stripe — Payment Intents, subscription billing, webhook handling, and European SCA compliance for card payments | 100% |
| **Ecommerce Seo** | Maximize organic search traffic with optimized product page meta tags, JSON-LD structured data for Google Shopping, and automated XML sitemaps | 96% |
| **Cart Logic** | Build a robust shopping cart with add/remove/update operations, session persistence across devices, and cart merge for returning logged-in users | 95% |
| **Inventory Tracking** | Track stock levels in real time across all your warehouses with inventory reservation to prevent overselling and support for backorders | 100% |
| **Shipping Rate Calculator** | Show real-time shipping rates from UPS, FedEx, USPS, and DHL at checkout by integrating directly with each carrier's rate API | 90% |
| **Customer Accounts** | Let shoppers register, manage their profile, save multiple addresses, and view their full order history in a personal account portal | 100% |
| **Discount Engine** | Create a flexible discount system supporting percentage off, fixed amounts, buy-one-get-one, tiered thresholds, and complex conditional rules | 89% |
| **Product Page Design** | Design high-converting product detail pages with image galleries, variant selectors, social proof, and clear calls-to-action that drive add-to-cart | 90% |

## All Categories

178 skills organized into 17 categories. Click any category to browse its skills.

| Category | Skills | Examples |
|----------|--------|----------|
| [**Business Operations**](skills/business-operations/) | 9 | Accounts Payable Management, B2b Commerce, Demand Forecasting, +6 more |
| [**Catalog Inventory**](skills/catalog-inventory/) | 11 | Catalog Import Export, Cogs Tracking Allocation, Digital Products, +8 more |
| [**Customer Crm**](skills/customer-crm/) | 9 | Customer Accounts, Customer Lifetime Value, Customer Segmentation, +6 more |
| [**Data Analytics**](skills/data-analytics/) | 16 | Ab Testing Ecommerce, Attribution Modeling, Cash Flow Forecasting, +13 more |
| [**Fulfillment Shipping**](skills/fulfillment-shipping/) | 8 | Dropshipping Integration, Free Shipping Thresholds, International Shipping, +5 more |
| [**Headless Modern**](skills/headless-modern/) | 8 | Commerce Api Gateway, Commerce Js Integration, Composable Commerce, +5 more |
| [**Infrastructure Performance**](skills/infrastructure-performance/) | 7 | Database Optimization Commerce, Ecommerce Caching, Edge Commerce, +4 more |
| [**Integrations Apis**](skills/integrations-apis/) | 7 | Analytics Integration, Email Service Integration, Erp Integration, +4 more |
| [**Marketing Growth**](skills/marketing-growth/) | 36 | Affiliate Program, Applovin Ads Integration, Cart Abandonment Recovery, +33 more |
| [**Payments Checkout**](skills/payments-checkout/) | 18 | Accounts Receivable Automation, Buy Now Pay Later, Cart Logic, +15 more |
| [**Platform Magento**](skills/platform-magento/) | 4 | Magento Graphql, Magento Indexing Caching, Magento Module Development, +1 more |
| [**Platform Salesforce Cc**](skills/platform-salesforce-cc/) | 3 | Sfcc Business Manager, Sfcc Cartridge Development, Sfcc Ocapi Scapi |
| [**Platform Shopify**](skills/platform-shopify/) | 7 | Shopify Admin Api, Shopify App Development, Shopify Checkout Extensions, +4 more |
| [**Platform Woocommerce**](skills/platform-woocommerce/) | 5 | Woocommerce Blocks, Woocommerce Performance, Woocommerce Plugin Development, +2 more |
| [**Pricing Promotions**](skills/pricing-promotions/) | 9 | Ab Testing Pricing, Coupon Management, Discount Engine, +6 more |
| [**Security Compliance**](skills/security-compliance/) | 9 | Account Security, Bot Protection, Data Retention Policies, +6 more |
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

See [CATALOG.md](CATALOG.md) for the complete list of all 178 skills with descriptions, tags, and evaluation scores.

## Contributing

We welcome contributions! Whether you want to improve an existing skill or add a new one:

1. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Check out the [skill template](docs/contributors/skill-template.md) to get started
3. Run `npm run validate` to check your skill before submitting

## License

MIT
