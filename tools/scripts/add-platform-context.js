#!/usr/bin/env node

/**
 * add-platform-context.js
 *
 * Rewrites the "## Prerequisites & Platform Notes" section in every
 * platform-agnostic SKILL.md file so that it leads with practical
 * Shopify / WooCommerce / SaaS guidance for real merchants, rather than
 * assuming a custom Node.js + PostgreSQL stack.
 *
 * Skipped categories:
 *   - platform-shopify, platform-woocommerce, platform-magento,
 *     platform-salesforce-cc  (already platform-specific)
 *   - headless-modern  (already assumes custom/headless stack)
 *
 * Behaviour:
 *   - If the file already contains "**BigCommerce / Other platforms**:" in
 *     the Prerequisites section, the new format is already present → skip.
 *   - Otherwise, replace the existing Prerequisites section (or insert a new
 *     one after "## When to Use") with the new merchant-friendly template.
 *
 * Usage:
 *   node tools/scripts/add-platform-context.js             # normal run
 *   node tools/scripts/add-platform-context.js --dry-run   # preview only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = path.resolve(__dirname, '../../skills');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Categories to skip entirely
// ---------------------------------------------------------------------------

const SKIP_CATEGORIES = new Set([
  'platform-shopify',
  'platform-woocommerce',
  'platform-magento',
  'platform-salesforce-cc',
  'headless-modern',
]);

// ---------------------------------------------------------------------------
// Category-specific platform notes (new merchant-friendly format)
// ---------------------------------------------------------------------------

const CATEGORY_NOTES = {
  'marketing-growth': {
    shopify:
      "Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.",
    woocommerce:
      'Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.',
    prerequisites:
      'A Shopify/WooCommerce store, relevant app/plugin installed, API keys for third-party services (Klaviyo, Stripe, etc.)',
  },
  'payments-checkout': {
    shopify:
      'Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.',
    woocommerce:
      'WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.',
    prerequisites:
      'A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app',
  },
  'data-analytics': {
    shopify:
      "Export data via the Shopify Admin API or use Shopify's built-in analytics. For advanced analytics, connect to a data warehouse (BigQuery, Snowflake) via tools like Fivetran, Stitch, or Shopify's bulk data export.",
    woocommerce:
      'Use WooCommerce Analytics (built-in) or plugins like Metorik. For custom reporting, query the WordPress database directly or export to a warehouse.',
    prerequisites:
      "Access to your store's API, a data warehouse (BigQuery, Snowflake, or PostgreSQL) for advanced analytics",
  },
  'catalog-inventory': {
    shopify:
      'Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.',
    woocommerce:
      'WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.',
    prerequisites: 'A store with product catalog access, API credentials',
  },
  'customer-crm': {
    shopify:
      'Shopify stores customer data natively. Use Shopify Customer APIs and metafields for custom data. For CRM, integrate with Klaviyo, HubSpot, or Gorgias via Shopify webhooks.',
    woocommerce:
      'Customer data lives in WordPress. Extend with CRM plugins (HubSpot for WooCommerce, Metorik). Use woocommerce_created_customer and profile hooks.',
    prerequisites: 'A store with customer data, CRM tool (Klaviyo, HubSpot) if needed',
  },
  'pricing-promotions': {
    shopify:
      "Use Shopify's built-in discount system, Shopify Functions for custom discount logic, or apps like Bold Discounts. Price rules can be managed via the Admin API.",
    woocommerce:
      'WooCommerce has built-in coupons and pricing rules. Extend with plugins (Dynamic Pricing, WooCommerce Subscriptions) or custom code via woocommerce_get_price filter.',
    prerequisites:
      'A store with pricing control, Shopify Functions or WooCommerce hooks for custom logic',
  },
  'security-compliance': {
    shopify:
      "Shopify handles PCI compliance, SSL, and infrastructure security. Focus on app-level security, GDPR consent (via Shopify Privacy API), and access controls.",
    woocommerce:
      'You manage your own hosting security. Use security plugins (Wordfence, Sucuri), SSL certificate, and PCI-compliant payment gateways. GDPR handled via cookie consent plugins.',
    prerequisites:
      "Understanding of your platform's security model, relevant compliance requirements",
  },
  'storefront-ui': {
    shopify:
      'Build with Shopify themes (Liquid), Shopify Hydrogen (React), or headless with the Storefront API. These component patterns work in any React-based Shopify setup.',
    woocommerce:
      'Build with WooCommerce Blocks (React), classic PHP themes, or headless with WooCommerce REST API. These patterns apply to block-based or headless storefronts.',
    prerequisites: 'A storefront codebase (theme, Hydrogen app, or headless frontend)',
  },
  'fulfillment-shipping': {
    shopify:
      'Use Shopify Shipping (carrier-calculated rates), Shopify Fulfillment Network, or apps like ShipStation. The Fulfillment API handles custom fulfillment workflows.',
    woocommerce:
      'Use WooCommerce Shipping or plugins (ShipStation, WooCommerce Table Rate Shipping). Extend with woocommerce_shipping_methods filter.',
    prerequisites: 'A store with shipping configured, carrier API accounts if using custom rates',
  },
  'business-operations': {
    shopify:
      'Integrate with Shopify via Admin API for orders, customers, and inventory. Use Shopify Flow for automation. Connect ERP/OMS via apps or custom webhooks.',
    woocommerce:
      'Use WooCommerce REST API for order/inventory data. Automate with AutomateWoo or custom WordPress cron jobs. Connect external systems via webhooks.',
    prerequisites: 'A running store, API access, relevant third-party accounts (ERP, OMS, etc.)',
  },
  'infrastructure-performance': {
    shopify:
      "Shopify manages infrastructure, CDN, and scaling. Focus on Liquid template performance, image optimization via Shopify's CDN, and app performance.",
    woocommerce:
      'You manage hosting and performance. Use caching plugins (WP Rocket, Redis Object Cache), CDN (Cloudflare), and optimize database queries.',
    prerequisites: 'Access to your hosting/infrastructure, monitoring tools',
  },
  'integrations-apis': {
    shopify:
      'Shopify supports webhooks, the Admin API, and app extensions for integrations. Use Shopify Flow or custom apps to connect third-party services.',
    woocommerce:
      'Use WooCommerce REST API and WordPress hooks for integrations. Connect via plugins or custom PHP code.',
    prerequisites: 'API credentials for both your store and the external service',
  },
};

// Fallback for any unlisted category
const DEFAULT_NOTES = CATEGORY_NOTES['business-operations'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively find all SKILL.md files under a directory. */
function findSkillFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSkillFiles(full));
    } else if (entry.name === 'SKILL.md') {
      results.push(full);
    }
  }
  return results;
}

/** Parse the category field from YAML frontmatter. */
function parseCategory(content) {
  const match = content.match(/^category:\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Build the new merchant-friendly "## Prerequisites & Platform Notes" block.
 */
function buildNewSection(category) {
  const notes = CATEGORY_NOTES[category] || DEFAULT_NOTES;

  return [
    '## Prerequisites & Platform Notes',
    '',
    `**Shopify**: ${notes.shopify}`,
    `**WooCommerce**: ${notes.woocommerce}`,
    '**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform\'s app marketplace first.',
    '**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.',
    '',
    `**You'll need**: ${notes.prerequisites}`,
  ].join('\n');
}

/**
 * Return true if the file already has the new-format section
 * (identified by the "BigCommerce / Other platforms" marker line).
 */
function hasNewFormat(content) {
  return content.includes('**BigCommerce / Other platforms**:');
}

/**
 * Replace or insert the Prerequisites section.
 *
 * Strategy:
 *   1. If an existing "## Prerequisites & Platform Notes" heading is found,
 *      replace everything from that heading up to (but not including) the
 *      next "## " heading with the new section.
 *   2. Otherwise insert the new section right before "## Core Instructions".
 *   3. If neither anchor exists, return null (skip the file).
 */
function rewrite(content, newSection) {
  // Pattern: existing Prerequisites heading through to the next ## heading
  const prereqHeadingRe = /^## Prerequisites & Platform Notes\n[\s\S]*?(?=^## )/m;
  if (prereqHeadingRe.test(content)) {
    return content.replace(prereqHeadingRe, newSection + '\n\n');
  }

  // Fallback: insert before ## Core Instructions
  const coreMatch = content.match(/^## Core Instructions/m);
  if (coreMatch) {
    const idx = content.indexOf(coreMatch[0]);
    return content.slice(0, idx) + newSection + '\n\n' + content.slice(idx);
  }

  return null; // cannot find insertion point
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = findSkillFiles(SKILLS_ROOT);

  let skippedCategory = 0;
  let skippedAlreadyNew = 0;
  let skippedNoAnchor = 0;
  let updated = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const category = parseCategory(content);
    const rel = path.relative(SKILLS_ROOT, filePath);

    // Skip platform-specific and headless-modern categories
    if (SKIP_CATEGORIES.has(category)) {
      skippedCategory++;
      continue;
    }

    // Skip files that already have the new format
    if (hasNewFormat(content)) {
      skippedAlreadyNew++;
      continue;
    }

    const newSection = buildNewSection(category);
    const rewritten = rewrite(content, newSection);

    if (rewritten === null) {
      console.log(`  SKIP (no anchor found): ${rel}`);
      skippedNoAnchor++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  WOULD UPDATE: ${rel}`);
    } else {
      fs.writeFileSync(filePath, rewritten, 'utf-8');
      console.log(`  UPDATED: ${rel}`);
    }
    updated++;
  }

  console.log('\n--- Summary ---');
  console.log(`Total SKILL.md files found:          ${files.length}`);
  console.log(`Skipped (platform/headless category): ${skippedCategory}`);
  console.log(`Skipped (already new format):         ${skippedAlreadyNew}`);
  console.log(`Skipped (no insertion anchor):        ${skippedNoAnchor}`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}:                        ${updated}`);
}

main();
