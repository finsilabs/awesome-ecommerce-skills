---
name: product-content-enrichment
description: "Use AI to auto-generate product descriptions, extract attributes, and tag images to enrich your catalog at scale using platform tools and AI writing apps"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [ai, product-descriptions, content, attributes, image-tagging, llm, enrichment, pim]
triggers: ["AI product descriptions", "generate product content", "attribute extraction", "image tagging", "product enrichment", "bulk product descriptions"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Content Enrichment

## Overview

Rich product content — compelling descriptions, complete attributes, and well-tagged images — drives both conversion and SEO. When a catalog is imported from a supplier with sparse content, enrichment is the next step. AI tools can generate descriptions, extract attributes, and suggest tags at scale. Platform-native AI features and dedicated apps handle the common cases without custom development.

## When to Use This Skill

- When importing a supplier catalog that has only product names, SKUs, and sparse descriptions
- When product descriptions are inconsistent in style or missing SEO keywords
- When image metadata (alt text, tags) is missing and needs to be generated at scale
- When a catalog refresh requires rewriting hundreds of product descriptions in a new brand voice

## Core Instructions

### Step 1: Determine platform and choose the right tool

| Platform | Built-in AI | Recommended App/Tool |
|----------|------------|---------------------|
| **Shopify** | Shopify Magic (AI description generation, built-in) | Jasper for Shopify, or ChatGPT for bulk generation via CSV |
| **WooCommerce** | None native | ChatGPT + WP All Import for bulk import; Hypotenuse AI WooCommerce plugin |
| **BigCommerce** | None native | Feedonomics for feed enrichment; Jasper or ChatGPT for descriptions |
| **Any platform (bulk)** | Claude / ChatGPT / Gemini | Generate descriptions in bulk via CSV, then import using platform tools |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Shopify Magic (built-in, free)**

Shopify Magic is available to all merchants on any plan.

1. Go to **Admin → Products → [Product]**
2. In the product description editor, click the **sparkle icon** (✨) at the top right
3. Enter a prompt or let Shopify Magic generate from the product title and existing details
4. Review the generated text — edit to match your brand voice
5. Click **Save** when satisfied

Limitations: Shopify Magic works one product at a time; not suitable for bulk enrichment.

**Option B: Bulk generation with CSV + AI**

For enriching hundreds of products at once:

1. **Export current catalog**: Admin → Products → Export (download as CSV)
2. **Generate descriptions in bulk**: Paste your product data into ChatGPT, Claude, or another AI tool with a prompt like:

```
For each of the following products, write a product description in this format:
- Opening sentence: 1 compelling benefit sentence (max 20 words)
- 2-3 sentence paragraph: features and use cases
- 4-6 bullet points: key specifications

Brand voice: [describe your brand voice]
Do not invent specifications not present in the product data.

Products:
[paste your CSV rows]
```

3. **Import back into Shopify**: Use **Matrixify** (App Store) to import the enriched CSV with updated descriptions; map the description column to the Shopify body HTML field

**Option C: Hypotenuse AI or Jasper (App Store)**

These apps integrate directly with Shopify:

1. Install from the Shopify App Store
2. Connect to your product catalog
3. Select products to enrich and click generate
4. Review drafts in the app's editor before publishing
5. Publish approved descriptions directly to Shopify

---

#### WooCommerce

**Bulk generation workflow:**

1. **Export products**: WooCommerce → Products → Export (CSV)
2. **Generate descriptions** using an AI tool of your choice (ChatGPT, Claude, Jasper)
3. **Import enriched data**: Use **WP All Import Pro** to import the updated CSV back into WooCommerce, mapping the description column to the product description field

**Hypotenuse AI for WooCommerce:**
- Install the Hypotenuse AI plugin from WooCommerce.com
- Select multiple products from your product list
- Click **Generate Content** to create descriptions in bulk
- Review and approve before publishing

**For attribute extraction:**
- Use AI to extract structured attributes (material, dimensions, weight, care instructions) from existing descriptions
- Add extracted attributes to WooCommerce product attributes under the **Attributes** tab
- These become filterable facets in your navigation

---

#### BigCommerce

**Bulk description generation:**

1. Go to **Products → Export** and download the product catalog CSV
2. Generate enriched descriptions using an AI tool
3. Re-import using **Products → Import**

**Feedonomics for feed enrichment:**
- Install Feedonomics from the BigCommerce App Marketplace
- Feedonomics can use AI to optimize product titles and descriptions specifically for Google Shopping, Amazon, and other channels
- Particularly useful for enriching attributes required by feed destinations (GTIN, brand, MPN)

---

#### Custom / Headless

For headless platforms with a custom database, build an enrichment pipeline with a human review gate:

```typescript
// lib/productEnrichment.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const DESCRIPTION_PROMPT = `You are a product copywriter. Generate a product description with:
1. A compelling opening sentence (max 20 words) highlighting the main benefit
2. A 2-3 sentence paragraph describing features
3. 4-6 key feature bullet points

Brand voice: {brandVoice}
Constraints:
- Use only the provided attributes — do not invent specifications
- Target: 80-120 words for the paragraph, plus bullets
- Include the product name and 1-2 SEO keywords naturally
- Do not use superlatives like "best" or "amazing"

Product: {name}
Category: {category}
Attributes: {attributes}`;

// Generate description for a single product
export async function generateProductDescription(product: Product, brandVoice: string): Promise<string> {
  const attributeText = Object.entries(product.attributes ?? {})
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const prompt = DESCRIPTION_PROMPT
    .replace('{brandVoice}', brandVoice)
    .replace('{name}', product.name)
    .replace('{category}', product.category)
    .replace('{attributes}', attributeText || 'Not provided');

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

// Batch enrichment with human review gate — saves drafts, never auto-publishes
export async function enrichProductsBatch(productIds: string[], brandVoice: string) {
  const CONCURRENCY = 5;
  const results = [];

  for (let i = 0; i < productIds.length; i += CONCURRENCY) {
    const chunk = productIds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(chunk.map(async productId => {
      const product = await db.products.findUnique({ where: { id: productId }, include: { attributes: true } });
      try {
        const description = await generateProductDescription(product, brandVoice);
        // Save as draft — requires human approval before going live
        await db.productEnrichmentDrafts.upsert({
          where: { productId },
          create: { productId, description, status: 'pending_review' },
          update: { description, status: 'pending_review', updatedAt: new Date() },
        });
        return { productId, status: 'success' };
      } catch (err) {
        return { productId, status: 'error', error: err.message };
      }
    }));
    results.push(...batchResults);
  }

  return results;
}

// Approve a draft and publish to the product
export async function approveDraft(productId: string, approvedBy: string) {
  const draft = await db.productEnrichmentDrafts.findUnique({ where: { productId } });
  if (!draft) throw new Error('Draft not found');

  await db.$transaction([
    db.products.update({ where: { id: productId }, data: { description: draft.description } }),
    db.productEnrichmentDrafts.update({
      where: { productId },
      data: { status: 'approved', approvedBy, approvedAt: new Date() },
    }),
  ]);
}
```

---

### Step 3: Review and approve AI-generated content

**Never auto-publish AI-generated content without human review.** AI can:
- Invent specifications not in the source data (hallucination)
- Use a tone inconsistent with your brand
- Include legally problematic claims

**Review workflow:**
1. Generate descriptions as drafts
2. Use a simple spreadsheet or your platform's product edit screen to review each one
3. Edit tone, accuracy, and brand voice before approving
4. Track approval rate — if you're rejecting more than 30% of drafts, refine your prompt

**Prioritize which products to enrich first:**
- High-traffic, low-conversion products (check Analytics)
- Products with zero or very short descriptions
- New arrivals that need SEO content to start ranking

---

### Step 4: Enrich product images with alt text

Alt text serves both accessibility and image SEO.

**Shopify:**
- Go to **Products → [Product] → Images**
- Click the **...** menu on any image → **Edit alt text**
- Enter a descriptive alt text (e.g., "Blue cotton t-shirt with round neck, men's size M")
- For bulk alt text: use Matrixify with a column for `Image Alt Text`

**WooCommerce:**
- Upload an image and click **Edit** in the media library
- Fill in the **Alt Text** field
- For existing images: go to **Media Library → [Image] → Edit**

**For bulk alt text generation:**
1. Export a list of product images with their product titles
2. Use an AI tool to generate descriptive alt text for each image
3. Import back using your platform's bulk tools

## Best Practices

- **Always use human review before publishing AI descriptions** — never auto-publish; track approval rate and use it to iterate on your prompts
- **Store AI-generated content as drafts separate from live content** — never overwrite the published description in-place until reviewed and approved
- **Use lower temperature settings for product descriptions** (0.3–0.5 in ChatGPT/Claude) — consistent, on-brand output is more valuable than creative variation
- **Include your brand voice guidelines in every prompt** — "Professional yet approachable, focus on quality, no superlatives" produces far better output than prompting without brand context
- **Enrich highest-priority products first** — start with your top 20% revenue products before tackling the long tail

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| AI invents specifications not in the source data | Add explicit constraints to the prompt: "Use only the provided attributes — do not invent or assume values"; verify output against the product spec |
| All AI descriptions sound identical | Add product-type-specific instructions (e.g., different prompts for footwear vs. electronics vs. apparel) |
| Descriptions miss SEO keywords | Include "naturally incorporate these SEO keywords: [list]" in the prompt; check with a keyword tool after generation |
| Bulk import overwrites good existing descriptions | Filter your import to only products with empty or very short descriptions; don't overwrite manually written descriptions |
| AI image tagging quality is poor | Use AI image analysis (GPT-4 Vision, Claude) for alt text generation rather than keyword-based tools; provide the product name as context |

## Related Skills

- @catalog-import-export
- @product-data-modeling
- @product-categorization
