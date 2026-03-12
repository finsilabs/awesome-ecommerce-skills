# Contributing to Awesome E-Commerce Skills

Thank you for contributing! This guide covers everything you need to add or improve skills.

## Adding a New Skill

1. **Fork and clone** this repository
2. **Create a branch:** `git checkout -b add/your-skill-name`
3. **Create the skill directory:**
   ```
   skills/<category>/your-skill-name/
   └── SKILL.md
   ```
4. **Write SKILL.md** using the [skill template](docs/contributors/skill-template.md)
5. **Validate locally:** `npm run validate`
6. **Submit a PR**

## Skill Quality Bar

Every skill must have at minimum:

- Valid YAML frontmatter with all required fields
- **Overview** — 2-4 sentences explaining what the skill does
- **When to Use This Skill** — bullet list of scenarios
- **Core Instructions** — numbered steps or structured guidance
- **Examples** — at least one code sample or configuration snippet

See [quality-bar.md](docs/contributors/quality-bar.md) for the full quality bar.

## Skill Format

See [skill-anatomy.md](docs/contributors/skill-anatomy.md) for the complete format reference.

## Validation

```sh
npm install
npm run validate          # Soft mode (warnings)
npm run validate:strict   # Strict mode (errors fail)
```

## Categories

| Category | Directory |
|----------|-----------|
| Storefront & UI | `storefront-ui` |
| Catalog & Inventory | `catalog-inventory` |
| Payments & Checkout | `payments-checkout` |
| Pricing & Promotions | `pricing-promotions` |
| Fulfillment & Shipping | `fulfillment-shipping` |
| Customer & CRM | `customer-crm` |
| Marketing & Growth | `marketing-growth` |
| Shopify | `platform-shopify` |
| WooCommerce | `platform-woocommerce` |
| Magento | `platform-magento` |
| Salesforce CC | `platform-salesforce-cc` |
| Headless & Modern | `headless-modern` |
| Security & Compliance | `security-compliance` |
| Infrastructure & Performance | `infrastructure-performance` |
| Integrations & APIs | `integrations-apis` |
| Data & Analytics | `data-analytics` |
| Business Operations | `business-operations` |
