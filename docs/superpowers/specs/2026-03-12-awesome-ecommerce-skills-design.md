# Awesome E-Commerce Skills — Design Spec

## Overview

A curated, open-source repository of 132 e-commerce skills for AI coding assistants (Claude Code, Cursor, Gemini CLI, Copilot, Codex CLI) and e-commerce practitioners. Modeled after [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) but focused exclusively on e-commerce.

**Target audience:** Developers building e-commerce features + practitioners operating e-commerce businesses.

**Approach:** Phased launch — Phase 1 ships 132 skills with full tooling (validation, catalog generation, CI, contributing guide) and Tessl eval integration for measurable skill quality. Phase 2 adds web app, npm installer, and i18n.

**Key differentiator:** Every skill is evaluated using [Tessl](https://tessl.io) task evals — baseline vs with-skill comparison — so users can see proven effectiveness, not just well-formatted instructions.

---

## Repository Structure

```
awesome-ecommerce-skills/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Validate skills, regenerate catalog
│   │   ├── eval.yml                  # Tessl eval (manual + weekly schedule)
│   │   └── pages.yml                 # GitHub Pages (Phase 2)
│   ├── ISSUE_TEMPLATE/
│   │   ├── new-skill.md
│   │   └── bug-report.md
│   └── PULL_REQUEST_TEMPLATE.md
├── data/
│   ├── catalog.json                  # Machine-readable full catalog
│   ├── skills_index.json             # Flat index with metadata
│   ├── aliases.json                  # Shorthand skill aliases
│   ├── bundles.json                  # Role-based skill groupings
│   └── workflows.json                # Multi-step e-commerce workflows
├── docs/
│   ├── contributors/
│   │   ├── skill-template.md
│   │   ├── skill-anatomy.md
│   │   └── quality-bar.md
│   ├── users/
│   │   ├── getting-started.md
│   │   └── bundles.md
│   └── maintainers/
│       └── release-process.md
├── skills/                           # 17 category directories
│   ├── storefront-ui/
│   ├── catalog-inventory/
│   ├── payments-checkout/
│   ├── pricing-promotions/
│   ├── fulfillment-shipping/
│   ├── customer-crm/
│   ├── marketing-growth/
│   ├── platform-shopify/
│   ├── platform-woocommerce/
│   ├── platform-magento/
│   ├── platform-salesforce-cc/
│   ├── headless-modern/
│   ├── security-compliance/
│   ├── infrastructure-performance/
│   ├── integrations-apis/
│   ├── data-analytics/
│   └── business-operations/
├── tools/
│   ├── scripts/
│   │   ├── validate.js
│   │   ├── generate-catalog.js
│   │   └── generate-readme.js
│   └── lib/
│       └── skill-parser.js
├── CATALOG.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE                           # MIT
├── README.md
└── package.json
```

---

## Skill Format

Each skill lives in its own directory under `skills/<category>/<skill-name>/`. The mandatory file is `SKILL.md`. Optional supporting directories: `references/`, `templates/`, `examples/`.

### SKILL.md Format

```markdown
---
name: cart-abandonment-recovery
description: "Implement cart abandonment detection and multi-channel recovery flows"
category: marketing-growth
risk: safe
source: community
date_added: "2026-03-12"
tags: [cart, abandonment, email, recovery, conversion]
tools: [claude-code, cursor, gemini-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Cart Abandonment Recovery

## Overview
2-4 sentence explanation of what this skill helps you do.

## When to Use This Skill
- Bullet list of trigger scenarios

## Core Instructions
Numbered steps or structured guidance.

## Examples
Code samples, configuration snippets.

## Best Practices
Do's and don'ts.

## Common Pitfalls
Problem-solution pairs.

## Related Skills
- @checkout-flow-optimization
- @email-marketing-automation
```

### Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Kebab-case, must match directory name |
| `description` | Yes | string | Under 200 chars |
| `category` | Yes | string | Must match parent directory |
| `risk` | Yes | enum | `safe` (no system changes), `unknown` (not yet assessed), `critical` (modifies payment/order/infra state) |
| `source` | Yes | enum | `community`, `personal`, `curated` |
| `date_added` | Yes | string | ISO date |
| `date_modified` | No | string | ISO date, updated when skill content changes significantly |
| `tags` | Yes | array | Keywords for search |
| `triggers` | No | array | Natural language phrases for AI assistant matching (e.g., `["recover abandoned carts", "cart abandonment"]`) |
| `tools` | Yes | array | From: `claude-code`, `cursor`, `gemini-cli`, `copilot`, `codex-cli`, `kiro`, `opencode` |
| `platforms` | Yes | array | E-commerce platforms or `platform-agnostic` |
| `difficulty` | Yes | enum | `beginner`, `intermediate`, `advanced` |

### Content Sections (recommended order)

1. Title (H1)
2. Overview — 2-4 sentences
3. When to Use This Skill — bullet list
4. Core Instructions — numbered steps
5. Examples — code samples
6. Best Practices — do's and don'ts
7. Common Pitfalls — problem-solution pairs
8. Related Skills — `@skill-name` cross-references

---

## Skills Catalog (132 Skills)

### Storefront & UI (12 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `product-page-design` | High-converting product page layouts with image galleries, variant selectors, and social proof | intermediate |
| `search-autocomplete` | Implement typeahead search with fuzzy matching, filters, and merchandising rules | intermediate |
| `faceted-navigation` | Build filterable product listings with multi-select facets and URL-driven state | intermediate |
| `mega-menu-builder` | Category navigation with mega menus, featured products, and promotional banners | beginner |
| `responsive-storefront` | Mobile-first responsive patterns for commerce (thumb-friendly cart, sticky buy bar) | beginner |
| `quick-view-modal` | Product quick-view overlays with add-to-cart without leaving the listing page | beginner |
| `image-zoom-360` | Product image zoom, 360-degree views, and video integration | intermediate |
| `wishlist-save-for-later` | Persistent wishlists with sharing, back-in-stock alerts, and move-to-cart | intermediate |
| `recently-viewed-products` | Track and display browsing history with sessionStorage/cookie strategies | beginner |
| `product-comparison` | Side-by-side feature comparison tables with dynamic attribute selection | intermediate |
| `accessibility-commerce` | WCAG 2.1 AA compliance for e-commerce — screen readers, keyboard nav, ARIA for carts | advanced |
| `storefront-theming` | Theme architecture with design tokens, CSS custom properties, and white-labeling | advanced |

### Catalog & Inventory (10 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `product-data-modeling` | Schema design for products with variants, options, attributes, and relationships | intermediate |
| `variant-matrix` | Generate and manage variant combinations (size x color x material) with SKU strategies | intermediate |
| `inventory-tracking` | Real-time stock tracking across warehouses with reservation and backorder logic | advanced |
| `catalog-import-export` | Bulk product import/export via CSV, JSON, XML with validation and error handling | intermediate |
| `product-categorization` | Hierarchical taxonomy design with breadcrumbs, auto-categorization, and SEO | intermediate |
| `digital-products` | Manage downloadable goods — license keys, download limits, expiration, delivery | intermediate |
| `product-bundles-kits` | Bundle/kit management with dynamic pricing, inventory deduction, and display logic | intermediate |
| `multi-warehouse` | Multi-location inventory with allocation rules, transfer orders, and split fulfillment | advanced |
| `low-stock-alerts` | Automated reorder point monitoring with supplier notifications and demand forecasting | intermediate |
| `product-content-enrichment` | AI-assisted product descriptions, attribute extraction, and image tagging | intermediate |

### Payments & Checkout (10 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `checkout-flow-optimization` | Multi-step vs single-page checkout design with conversion best practices | intermediate |
| `stripe-integration` | Stripe payment intents, subscriptions, webhooks, and SCA compliance | intermediate |
| `paypal-integration` | PayPal checkout, express buttons, PayPal Commerce Platform setup | intermediate |
| `cart-logic` | Shopping cart state management — add/remove/update, persistence, merge strategies | intermediate |
| `guest-checkout` | Frictionless guest checkout with optional account creation post-purchase | beginner |
| `order-processing-pipeline` | Order state machine: pending -> confirmed -> processing -> shipped -> delivered | advanced |
| `tax-calculation` | Tax engine integration (TaxJar, Avalara) with nexus rules and VAT handling | advanced |
| `multi-currency` | Currency detection, conversion, rounding rules, and localized formatting | intermediate |
| `buy-now-pay-later` | Integrate BNPL providers (Klarna, Afterpay, Affirm) with eligibility checks | intermediate |
| `subscription-billing` | Recurring payment flows with dunning, plan changes, prorations, and cancellation | advanced |

### Pricing & Promotions (9 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `discount-engine` | Rule-based discount system — percentage, fixed, BOGO, tiered, conditional | intermediate |
| `coupon-management` | Coupon CRUD, validation rules, usage limits, single-use codes, bulk generation | intermediate |
| `dynamic-pricing` | Demand-based pricing, competitor monitoring, and algorithmic price optimization | advanced |
| `flash-sale-engine` | Time-limited sales with countdown timers, stock limits, and queue management | advanced |
| `loyalty-points-system` | Points earning, redemption rules, tier progression, and expiration policies | intermediate |
| `volume-pricing` | Quantity-based price breaks, tiered pricing tables, and B2B price lists | intermediate |
| `gift-cards` | Gift card issuance, redemption, balance tracking, and partial-use handling | intermediate |
| `price-rules-engine` | Stackable pricing rules with priority, exclusions, and customer segment targeting | advanced |
| `ab-testing-pricing` | Price experimentation frameworks with statistical significance and revenue tracking | advanced |

### Fulfillment & Shipping (8 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `shipping-rate-calculator` | Real-time rate calculation with carrier APIs (UPS, FedEx, USPS, DHL) | intermediate |
| `order-fulfillment-workflow` | Pick-pack-ship workflows with barcode scanning and packing slip generation | intermediate |
| `returns-management` | RMA flow with return labels, refund/exchange logic, and restocking | intermediate |
| `shipment-tracking` | Track shipments across carriers with webhook-driven status updates | intermediate |
| `free-shipping-thresholds` | Dynamic free shipping rules with progress indicators and upsell nudges | beginner |
| `dropshipping-integration` | Supplier order routing, inventory sync, and margin calculation for dropship | advanced |
| `same-day-delivery` | Local delivery zone management, time-slot booking, and driver dispatch | advanced |
| `international-shipping` | Cross-border commerce: customs forms, duties estimation, restricted items | advanced |

### Customer & CRM (9 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `customer-accounts` | Registration, profile management, address book, and order history | beginner |
| `product-reviews-ratings` | Review collection, moderation, aggregate scoring, and display widgets | intermediate |
| `customer-segmentation` | RFM analysis, behavioral segments, and cohort-based targeting | advanced |
| `personalization-engine` | Product recommendations using collaborative filtering and browsing history | advanced |
| `customer-support-integration` | Helpdesk integration (Zendesk, Intercom) with order context injection | intermediate |
| `live-chat-commerce` | Real-time chat with product sharing, cart assistance, and agent tools | intermediate |
| `user-generated-content` | Customer photos, Q&A sections, and social proof widgets | intermediate |
| `referral-program` | Refer-a-friend flows with unique links, reward tiers, and fraud prevention | intermediate |
| `customer-lifetime-value` | CLV calculation models, prediction, and retention strategy automation | advanced |

### Marketing & Growth (12 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `ecommerce-seo` | Product page SEO, structured data (JSON-LD), canonical URLs, and sitemap generation | intermediate |
| `email-marketing-automation` | Triggered email flows — welcome, post-purchase, win-back, browse abandonment | intermediate |
| `cart-abandonment-recovery` | Multi-channel abandonment recovery with timing sequences and incentive escalation | intermediate |
| `social-commerce` | Shoppable posts, Instagram/TikTok catalog sync, and social checkout | intermediate |
| `google-shopping-feed` | Product feed generation for Google Merchant Center with optimization rules | intermediate |
| `conversion-rate-optimization` | CRO audit frameworks, heatmap analysis, and checkout funnel optimization | intermediate |
| `push-notifications` | Web push for price drops, back-in-stock, and cart reminders | intermediate |
| `affiliate-program` | Affiliate tracking, commission tiers, payout management, and fraud detection | advanced |
| `content-commerce` | Blog-to-commerce integration, shoppable content, and editorial merchandising | intermediate |
| `sms-marketing` | SMS campaigns with opt-in, segmentation, and compliance (TCPA/GDPR) | intermediate |
| `influencer-tracking` | Influencer campaign attribution, UTM management, and ROI measurement | intermediate |
| `exit-intent-popups` | Exit-intent detection with offer targeting, frequency capping, and A/B testing | beginner |

### Platform — Shopify (7 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `shopify-theme-development` | Liquid templating, theme architecture, sections, and theme app extensions | intermediate |
| `shopify-app-development` | Shopify app scaffold with OAuth, App Bridge, and Polaris UI | advanced |
| `shopify-storefront-api` | Storefront API queries for headless builds with buy SDK | intermediate |
| `shopify-admin-api` | Admin API for products, orders, customers with GraphQL and REST | intermediate |
| `shopify-checkout-extensions` | Checkout UI extensions and Shopify Functions for custom logic | advanced |
| `shopify-webhooks` | Webhook registration, verification, and reliable event processing | intermediate |
| `shopify-metafields` | Custom data with metafield definitions, validation, and storefront access | beginner |

### Platform — WooCommerce (5 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `woocommerce-plugin-development` | Custom WooCommerce plugins with hooks, filters, and settings API | intermediate |
| `woocommerce-rest-api` | WooCommerce REST API for headless and integration use cases | intermediate |
| `woocommerce-blocks` | Gutenberg block-based checkout and cart customization | intermediate |
| `woocommerce-subscriptions` | Recurring payments and subscription product types in WooCommerce | intermediate |
| `woocommerce-performance` | WooCommerce optimization — query tuning, caching, and database cleanup | advanced |

### Platform — Magento (4 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `magento-module-development` | Custom Magento 2 modules with dependency injection and service contracts | advanced |
| `magento-graphql` | Magento GraphQL API for headless storefronts and PWA Studio | intermediate |
| `magento-indexing-caching` | Indexer management, Varnish config, and full-page cache strategies | advanced |
| `magento-multi-store` | Multi-website, multi-store setup with shared catalogs and scoped config | advanced |

### Platform — Salesforce Commerce Cloud (3 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `sfcc-cartridge-development` | SFRA cartridge architecture, controllers, and ISML templates | advanced |
| `sfcc-ocapi-scapi` | OCAPI and Shopper APIs for headless Salesforce Commerce | advanced |
| `sfcc-business-manager` | Business Manager configuration, import/export, and site preferences | intermediate |

### Headless & Modern Stack (8 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `medusa-development` | Medusa.js setup, custom services, subscribers, and API extensions | intermediate |
| `saleor-development` | Saleor GraphQL API, app development, and dashboard customization | intermediate |
| `shopify-hydrogen` | Hydrogen + Remix storefront with Oxygen deployment and Storefront API | intermediate |
| `composable-commerce` | MACH architecture — microservices, API-first, cloud-native, headless patterns | advanced |
| `jamstack-storefront` | Static-generated storefronts with Next.js/Astro + commerce API backends | intermediate |
| `commerce-api-gateway` | API gateway patterns for aggregating multiple commerce microservices | advanced |
| `pwa-storefront` | Progressive web app storefronts with offline catalog, service workers | intermediate |
| `commerce-js-integration` | Commerce.js (Chec) SDK integration for lightweight headless stores | beginner |

### Security & Compliance (7 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `pci-dss-compliance` | PCI-DSS requirements mapping, SAQ selection, and implementation checklist | advanced |
| `fraud-detection` | Rule-based and ML fraud scoring with 3DS, velocity checks, and manual review | advanced |
| `gdpr-ecommerce` | GDPR compliance — consent management, data export, right to deletion | intermediate |
| `bot-protection` | Anti-scraping, anti-scalping, and CAPTCHA strategies for commerce | intermediate |
| `secure-checkout` | TLS, CSP headers, tokenization, and XSS prevention for payment pages | intermediate |
| `account-security` | Brute-force protection, MFA, session management for customer accounts | intermediate |
| `data-retention-policies` | Order/customer data lifecycle management and automated purging | intermediate |

### Infrastructure & Performance (7 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `ecommerce-caching` | Multi-layer caching — CDN, application, database, and cart-aware cache invalidation | advanced |
| `image-optimization-cdn` | Product image pipeline — resize, compress, WebP/AVIF, lazy load, CDN delivery | intermediate |
| `flash-sale-scaling` | Auto-scaling, queue-based ordering, and circuit breakers for traffic spikes | advanced |
| `database-optimization-commerce` | Product query optimization, search indexing, and read-replica strategies | advanced |
| `monitoring-alerting-commerce` | Commerce-specific dashboards — checkout success rate, cart errors, payment failures | intermediate |
| `edge-commerce` | Edge computing for commerce — geo-routing, edge-side personalization, KV stores | advanced |
| `load-testing-commerce` | Load testing checkout and catalog with realistic shopping behavior simulation | intermediate |

### Integrations & APIs (7 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `erp-integration` | ERP sync patterns (SAP, NetSuite, Odoo) for orders, inventory, and customers | advanced |
| `marketplace-connectors` | List products on Amazon, eBay, Walmart with inventory sync and order import | advanced |
| `webhook-architecture` | Reliable webhook delivery with retries, signatures, dead-letter queues | intermediate |
| `product-information-management` | PIM integration (Akeneo, Salsify) for centralized product data | intermediate |
| `email-service-integration` | Transactional email setup (SendGrid, SES, Postmark) with template management | beginner |
| `analytics-integration` | GA4, Meta Pixel, server-side tagging, and data layer implementation | intermediate |
| `pos-integration` | Point-of-sale integration with online inventory and unified order management | advanced |

### Data & Analytics (6 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `ecommerce-data-warehouse` | Data warehouse design for commerce — star schema, ETL pipelines, dbt models | advanced |
| `sales-reporting-dashboard` | Revenue, AOV, conversion dashboards with drill-down and cohort analysis | intermediate |
| `product-analytics` | Product performance metrics, sell-through rates, and dead stock identification | intermediate |
| `customer-analytics` | RFM scoring, purchase frequency, churn prediction, and segment analysis | advanced |
| `ab-testing-ecommerce` | Experimentation platform for product pages, checkout, and pricing tests | intermediate |
| `attribution-modeling` | Multi-touch attribution for marketing spend optimization | advanced |

### Business Operations (8 skills)

| Skill | Description | Difficulty |
|-------|-------------|------------|
| `merchandising-rules` | Visual merchandising, product ranking rules, and automated collection curation | intermediate |
| `vendor-management` | Vendor portal, purchase orders, dropship routing, and performance scorecards | intermediate |
| `multi-channel-selling` | Unified catalog and inventory across DTC, wholesale, marketplace channels | advanced |
| `b2b-commerce` | B2B features — company accounts, quote workflows, custom catalogs, net terms | advanced |
| `order-management-system` | OMS design with distributed fulfillment, split orders, and backorder handling | advanced |
| `returns-refund-policy` | Policy engine for return windows, restocking fees, and automated approvals | intermediate |
| `demand-forecasting` | Inventory demand prediction using sales history, seasonality, and trends | advanced |
| `marketplace-building` | Multi-vendor marketplace architecture — seller onboarding, commissions, payouts | advanced |

---

## Data Files

### `data/catalog.json`

```json
{
  "generatedAt": "2026-03-12T...",
  "total": 132,
  "skills": [
    {
      "id": "cart-abandonment-recovery",
      "name": "Cart Abandonment Recovery",
      "description": "Multi-channel abandonment recovery...",
      "category": "marketing-growth",
      "tags": ["cart", "abandonment", "email"],
      "triggers": ["cart abandonment", "recover abandoned carts"],
      "path": "skills/marketing-growth/cart-abandonment-recovery",
      "platforms": ["platform-agnostic"],
      "difficulty": "intermediate"
    }
  ]
}
```

### `data/skills_index.json`

A lightweight index for search and autocomplete, omitting `tags`, `triggers`, and `tools` for a smaller payload. Each entry is a flat object:

```json
[
  {
    "id": "cart-abandonment-recovery",
    "path": "skills/marketing-growth/cart-abandonment-recovery",
    "category": "marketing-growth",
    "name": "Cart Abandonment Recovery",
    "description": "Multi-channel abandonment recovery...",
    "risk": "safe",
    "source": "curated",
    "date_added": "2026-03-12",
    "platforms": ["platform-agnostic"],
    "difficulty": "intermediate"
  }
]
```

**Distinction from `catalog.json`:** The catalog is the complete data source (includes tags, triggers, tools). The index is a slimmed-down version for fast loading in search UIs and tooling that doesn't need the full payload.

### `data/aliases.json`

Shorthand mappings from a short alias to the full path (always prefixed with `skills/`):

```json
{
  "checkout": "skills/payments-checkout/checkout-flow-optimization",
  "stripe": "skills/payments-checkout/stripe-integration",
  "shopify-app": "skills/platform-shopify/shopify-app-development",
  "seo": "skills/marketing-growth/ecommerce-seo"
}
```

All paths in all data files use the `skills/<category>/<skill-name>` format consistently.

### `data/bundles.json`

Bundles are overlapping subsets — a single skill can appear in multiple bundles.

| Bundle | Target Audience | ~Skills |
|--------|----------------|---------|
| `store-builder` | Developers building a new store | ~40 |
| `growth-marketer` | Marketing/CRO practitioners | ~25 |
| `platform-migrator` | Teams migrating between platforms | ~30 |
| `security-ops` | Security/compliance engineers | ~15 |
| `headless-architect` | Teams going headless/composable | ~20 |
| `b2b-specialist` | B2B commerce teams | ~15 |
| `marketplace-builder` | Multi-vendor marketplace developers | ~20 |
| `common` | Foundational skills everyone needs | ~15 |

### `data/workflows.json`

| Workflow | Steps | Description |
|----------|-------|-------------|
| Launch a DTC Store | 8 | Product modeling -> storefront -> checkout -> shipping -> launch |
| Migrate to Headless | 6 | Audit -> API layer -> new storefront -> data migration -> cutover |
| Black Friday Prep | 5 | Load testing -> scaling -> flash sales -> monitoring -> incident response |
| Build a Marketplace | 7 | Multi-vendor arch -> seller onboarding -> payouts -> catalog -> fulfillment |
| Commerce Security Audit | 5 | PCI assessment -> fraud review -> GDPR check -> bot protection -> hardening |

---

## Tooling

### Validation (`tools/scripts/validate.js`)

Checks:
- `SKILL.md` exists in each skill directory
- Valid YAML frontmatter with all required fields
- `name` matches directory name (kebab-case)
- `category` matches parent directory
- `difficulty` is `beginner`, `intermediate`, or `advanced`
- `platforms` from known list
- Description under 200 chars
- `@skill-name` cross-references resolve
- No broken relative links

Two modes: `--strict` (CI, fail on error) and default soft (warnings only).

### Catalog Generation (`tools/scripts/generate-catalog.js`)

Parses all `SKILL.md` frontmatter, outputs `data/catalog.json`, `data/skills_index.json`, and `CATALOG.md`.

### README Generation (`tools/scripts/generate-readme.js`)

Rebuilds skill count badges and category tables in `README.md`.

### `package.json`

```json
{
  "name": "awesome-ecommerce-skills",
  "version": "1.0.0",
  "description": "132 curated e-commerce skills for AI coding assistants",
  "license": "MIT",
  "scripts": {
    "validate": "node tools/scripts/validate.js",
    "validate:strict": "node tools/scripts/validate.js --strict",
    "catalog": "node tools/scripts/generate-catalog.js",
    "readme": "node tools/scripts/generate-readme.js",
    "chain": "npm run validate:strict && npm run catalog && npm run readme",
    "test": "node --test tools/scripts/__tests__/"
  },
  "devDependencies": {
    "yaml": "^2.8.2"
  }
}
```

### CI Pipeline (`.github/workflows/ci.yml`)

Triggers: push to `main`/`feat/*`, PRs to `main`.

1. Validate — `npm run validate:strict`
2. Test — `npm run test`
3. Regenerate — `npm run catalog && npm run readme`
4. Drift check — auto-commit generated files on `main` if changed
5. Tessl skill review — on PRs, runs `tesslio/skill-review` GitHub Action

---

## Tessl Integration

Each skill is evaluated using [Tessl](https://tessl.io) to measure whether it actually improves AI agent output compared to baseline (no skill). This is the key differentiator — every skill ships with eval evidence.

### Per-Skill Eval Structure

Each skill directory includes an `evals/` folder with Tessl scenarios:

```
skills/marketing-growth/cart-abandonment-recovery/
├── SKILL.md
├── evals/
│   ├── scenario-1/
│   │   ├── task.md           # Task brief for the agent
│   │   ├── criteria.json     # Scoring rubric with weighted criteria
│   │   └── capability.txt    # Which skill capability this tests
│   ├── scenario-2/
│   │   ├── task.md
│   │   ├── criteria.json
│   │   └── capability.txt
│   └── ...
├── references/
├── templates/
└── examples/
```

### Eval Workflow

1. **Generate scenarios**: `tessl scenario generate skills/<category>/<skill>/SKILL.md --count=3`
2. **Run evals**: `tessl eval run skills/<category>/<skill>/SKILL.md` — runs baseline (no skill) vs with-skill comparison
3. **Review results**: `tessl eval view --last` — check score gap
4. **Iterate**: If score gap is small or negative, revise the skill and re-run
5. **Publish**: `tessl tile publish` once eval scores are satisfactory

### Quality Gate

Skills must meet a minimum eval quality bar before merging:

- **Skill Review score**: Implementation Quality >= 7/10, Activation Quality >= 7/10
- **Task Eval score gap**: With-skill must score >= 15% higher than baseline
- Skills that fail the quality gate are flagged for revision, not merged

### Tessl SKILL.md Additions

Each skill's frontmatter includes eval metadata after first eval run:

```yaml
tessl:
  tile_id: "awesome-ecommerce/cart-abandonment-recovery"
  last_eval: "2026-03-15"
  eval_score_gap: 0.32    # 32% improvement over baseline
  eval_model: "claude-sonnet-4-6"
```

### CI Integration

#### PR Workflow (`.github/workflows/ci.yml` additions)

```yaml
# Tessl skill review on PRs
- name: Tessl Skill Review
  uses: tesslio/skill-review@v1
  with:
    path: skills/
```

#### Eval Workflow (`.github/workflows/eval.yml`)

Triggered manually or on schedule (weekly) to re-evaluate skills:

```yaml
name: Tessl Eval
on:
  workflow_dispatch:
    inputs:
      skill_path:
        description: 'Path to skill (or "all" for full suite)'
        required: true
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am UTC

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Tessl CLI
        run: curl -fsSL https://get.tessl.io | sh
      - name: Run evals
        run: tessl eval run ${{ github.event.inputs.skill_path || 'all' }}
        env:
          TESSL_API_KEY: ${{ secrets.TESSL_API_KEY }}
```

### Registry Publishing

Skills are published to the Tessl Registry under the `awesome-ecommerce` namespace, making them installable via:

```sh
tessl install awesome-ecommerce/cart-abandonment-recovery
tessl install awesome-ecommerce/stripe-integration
```

### Eval Dashboard

The `CATALOG.md` and web app (Phase 2) display per-skill eval scores:

| Skill | Category | Eval Gap | Model | Last Eval |
|-------|----------|----------|-------|-----------|
| `cart-abandonment-recovery` | marketing-growth | +32% | sonnet-4-6 | 2026-03-15 |
| `stripe-integration` | payments-checkout | +41% | sonnet-4-6 | 2026-03-15 |

This gives users confidence that skills are tested and effective, not just well-formatted markdown.

---

## README Structure

1. Title + tagline + badges (skill count, license, PRs welcome, platform compatibility, Tessl evaluated)
2. Table of Contents
3. Quick Start (3 steps)
4. Installation (including `tessl install awesome-ecommerce/<skill>`)
5. What's Inside
6. Project Structure
7. Eval Scores — top skills by eval gap (the differentiator)
8. Top 10 Starter Skills
9. Curated Bundles (table)
10. Workflows (table)
10. Categories (17-row table)
11. Browse All Skills (link to CATALOG.md)
12. Contributing
13. License (MIT)

---

## Known Gaps (Phase 2 Candidates)

Domain areas intentionally excluded from Phase 1:

- **Search infrastructure** — Elasticsearch/Algolia/Typesense setup, relevance tuning, synonym management (beyond the `search-autocomplete` UI skill)
- **Transactional messaging lifecycle** — Order confirmation, shipping notification, delivery confirmation as a distinct orchestration skill
- **Catalog localization** — Translated product content, locale-specific catalogs, RTL support (multi-currency is covered, multi-language is not)
- **Mobile app commerce** — Native SDKs, deep linking, Apple Pay / Google Pay as standalone skills
- **B2B deep-dive** — Contract pricing, quote-to-order workflows, approval chains as separate skills (currently a single `b2b-commerce` skill)
- **Accessibility testing** — Automated a11y CI pipelines, screen reader QA workflows (compliance is covered in `accessibility-commerce`)

---

## Phase 1 Delivery Plan

**Authoring approach:** AI-assisted generation with human review. Skills are generated in category batches, reviewed for accuracy and depth, then committed.

**Batch order (priority):**
1. Core commerce: Catalog & Inventory, Payments & Checkout, Storefront & UI
2. Operations: Pricing & Promotions, Fulfillment & Shipping, Business Operations
3. Growth: Marketing & Growth, Customer & CRM, Data & Analytics
4. Platform-specific: Shopify, WooCommerce, Magento, SFCC
5. Advanced: Headless & Modern, Security & Compliance, Infrastructure, Integrations

**Minimum viable skill (Phase 1 quality bar):** Every skill must have Overview, When to Use, Core Instructions, and at least one Example. Best Practices and Common Pitfalls are strongly recommended but may be added post-launch for lower-priority skills.

**Tooling ships first:** Validation, catalog generation, and CI are built before skill authoring begins, so every skill is validated on commit.

---

## Phase 2 (Future)

- Web app for browsing/searching skills (React + Vite)
- npm package with CLI installer
- i18n (Chinese, Spanish)
- GitHub Pages deployment
- Skills for known gaps listed above
- More skills (target 250+)
