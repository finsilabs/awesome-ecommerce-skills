---
name: product-content-enrichment
description: "AI-assisted product descriptions, attribute extraction, and image tagging"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [ai, product-descriptions, content, attributes, image-tagging, llm, enrichment, pim]
triggers: ["AI product descriptions", "generate product content", "attribute extraction", "image tagging", "product enrichment", "bulk product descriptions"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Content Enrichment

## Overview

Use AI to enrich sparse product catalog data: generate SEO-optimized product descriptions from structured attributes, extract missing attributes from existing descriptions, and auto-tag product images with categories, colors, and materials. Designed as a batch pipeline that can process thousands of products with human review gates for quality control before publishing.

## When to Use This Skill

- When importing a supplier catalog that has only product names, SKUs, and sparse descriptions
- When product descriptions are inconsistent in style or missing SEO keywords
- When image metadata (alt text, tags) is missing and needs to be generated at scale
- When a catalog refresh requires rewriting hundreds of product descriptions in a new brand voice

## Core Instructions

1. **Define the enrichment prompt templates**

   System prompts are stored as versioned templates so they can be A/B tested and updated without code changes.

   ```javascript
   // lib/enrichmentPrompts.js

   export const DESCRIPTION_PROMPT = `You are a product copywriter for an e-commerce store with the following brand voice:
   {brandVoice}

   Generate a product description with the following sections:
   1. A compelling opening sentence (max 20 words) — highlight the main benefit
   2. A 2-3 sentence paragraph describing the product features
   3. A bulleted list of 4-6 key features

   Constraints:
   - Use the provided attributes only — do not invent specifications
   - Target length: 80-120 words for the paragraph, plus the bullet list
   - Naturally include the product name and 1-2 SEO keywords
   - Do not use superlatives like "best" or "amazing"

   Product data:
   Name: {name}
   Category: {category}
   Attributes: {attributes}
   Keywords to include: {seoKeywords}`;

   export const ATTRIBUTE_EXTRACTION_PROMPT = `Extract structured product attributes from the description below.
   Return ONLY a valid JSON object with these keys if they can be determined from the text:
   material, color, dimensions, weight, care_instructions, country_of_origin, warranty

   Use null for any attribute not mentioned. Do not guess or infer values not explicitly stated.

   Description: {description}`;

   export const IMAGE_TAGGING_PROMPT = `Analyze this product image and return a JSON object with:
   {
     "alt_text": "A descriptive alt text (max 125 chars) for screen readers",
     "colors": ["primary color", "secondary color"],
     "tags": ["category", "material", "style", "use case"],
     "background": "white|lifestyle|studio|transparent"
   }

   Be specific about colors (e.g., "navy blue" not just "blue").`;
   ```

2. **Generate product descriptions in batch**

   ```javascript
   // lib/descriptionEnrichment.js
   import OpenAI from 'openai';

   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   export async function generateProductDescription(product, brandConfig) {
     const attributeText = Object.entries(product.attributes ?? {})
       .filter(([, v]) => v !== null)
       .map(([k, v]) => `${k}: ${v}`)
       .join('\n');

     const prompt = DESCRIPTION_PROMPT
       .replace('{brandVoice}', brandConfig.voice)
       .replace('{name}', product.name)
       .replace('{category}', product.category)
       .replace('{attributes}', attributeText || 'Not provided')
       .replace('{seoKeywords}', (product.seoKeywords ?? []).join(', ') || 'None specified');

     const response = await openai.chat.completions.create({
       model: 'gpt-4o',
       messages: [{ role: 'user', content: prompt }],
       temperature: 0.4,
       max_tokens: 400,
     });

     return response.choices[0].message.content;
   }

   // Batch with concurrency control and rate limiting
   export async function enrichProductsBatch(productIds, brandConfig) {
     const CONCURRENCY = 5; // Max 5 concurrent API calls
     const results = [];
     const chunks = chunkArray(productIds, CONCURRENCY);

     for (const chunk of chunks) {
       const batchResults = await Promise.all(
         chunk.map(async (productId) => {
           const product = await db.products.findUnique({
             where: { id: productId },
             include: { attributes: true, category: true },
           });

           try {
             const description = await generateProductDescription(product, brandConfig);
             return { productId, description, status: 'success' };
           } catch (err) {
             return { productId, error: err.message, status: 'error' };
           }
         })
       );
       results.push(...batchResults);

       // Save successful results as drafts (not yet published)
       for (const result of batchResults.filter(r => r.status === 'success')) {
         await db.productEnrichmentDrafts.upsert({
           where: { productId: result.productId },
           create: { productId: result.productId, description: result.description, status: 'pending_review' },
           update: { description: result.description, status: 'pending_review', updatedAt: new Date() },
         });
       }
     }

     return results;
   }

   function chunkArray(arr, size) {
     return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
   }
   ```

3. **Extract attributes from existing descriptions**

   ```javascript
   // lib/attributeExtraction.js
   export async function extractAttributes(productDescription) {
     const prompt = ATTRIBUTE_EXTRACTION_PROMPT.replace('{description}', productDescription);

     const response = await openai.chat.completions.create({
       model: 'gpt-4o-mini',
       messages: [{ role: 'user', content: prompt }],
       response_format: { type: 'json_object' },
       temperature: 0,
     });

     try {
       const attributes = JSON.parse(response.choices[0].message.content);
       // Strip null values and validate types
       return Object.fromEntries(
         Object.entries(attributes).filter(([, v]) => v !== null && v !== undefined)
       );
     } catch {
       throw new Error('Failed to parse attribute extraction response as JSON');
     }
   }
   ```

4. **Auto-tag product images using vision models**

   ```javascript
   // lib/imageTagging.js
   import { toBase64 } from './utils';
   import { downloadImage } from './storage';

   export async function tagProductImage(imageUrl) {
     // For URLs accessible to OpenAI, pass the URL directly
     // For private S3 URLs, generate a short-lived presigned URL first
     const response = await openai.chat.completions.create({
       model: 'gpt-4o',
       messages: [
         {
           role: 'user',
           content: [
             { type: 'text', text: IMAGE_TAGGING_PROMPT },
             { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
           ],
         },
       ],
       response_format: { type: 'json_object' },
       temperature: 0,
       max_tokens: 200,
     });

     return JSON.parse(response.choices[0].message.content);
   }

   // Batch tag images for a product
   export async function tagProductImages(product) {
     const results = [];
     for (const image of product.images) {
       const tags = await tagProductImage(image.url);
       results.push({ imageId: image.id, ...tags });

       // Update image record with AI-generated metadata
       await db.productImages.update({
         where: { id: image.id },
         data: {
           altText: image.altText || tags.alt_text, // Don't overwrite manual alt text
           aiTags: tags.tags,
           aiColors: tags.colors,
           aiBackground: tags.background,
         },
       });
     }
     return results;
   }
   ```

5. **Human review workflow before publishing**

   ```javascript
   // api/admin/enrichment/review.js

   // GET /api/admin/enrichment/pending
   export async function getPendingDrafts(req, res) {
     const drafts = await db.productEnrichmentDrafts.findMany({
       where: { status: 'pending_review' },
       include: { product: { include: { images: true } } },
       orderBy: { updatedAt: 'desc' },
       take: 50,
     });
     res.json({ drafts });
   }

   // POST /api/admin/enrichment/:productId/approve
   export async function approveDraft(req, res) {
     const draft = await db.productEnrichmentDrafts.findUnique({
       where: { productId: req.params.productId },
     });
     if (!draft) return res.status(404).json({ error: 'Draft not found' });

     await db.$transaction([
       db.products.update({
         where: { id: req.params.productId },
         data: { description: draft.description },
       }),
       db.productEnrichmentDrafts.update({
         where: { productId: req.params.productId },
         data: { status: 'approved', approvedBy: req.session.userId, approvedAt: new Date() },
       }),
     ]);
     res.json({ approved: true });
   }

   // POST /api/admin/enrichment/:productId/reject
   export async function rejectDraft(req, res) {
     await db.productEnrichmentDrafts.update({
       where: { productId: req.params.productId },
       data: {
         status: 'rejected',
         rejectionNote: req.body.note,
         rejectedBy: req.session.userId,
       },
     });
     res.json({ rejected: true });
   }
   ```

## Examples

### Running enrichment for a full catalog import

```javascript
// After importing 500 products from a supplier CSV
const productIds = importedProducts.map(p => p.id);

const brandConfig = {
  voice: 'Professional yet approachable. Focus on quality and craftsmanship. Avoid jargon.',
};

const job = await createEnrichmentJob({
  productIds,
  tasks: ['description', 'attributes', 'image_tags'],
  brandConfig,
});

console.log(`Enrichment job ${job.id} queued for ${productIds.length} products`);
```

### Diff view for reviewing AI-generated descriptions

```jsx
function EnrichmentReviewItem({ product, draft }) {
  return (
    <div className="review-item">
      <div className="review-columns">
        <div>
          <h3>Original</h3>
          <p>{product.description || <em>No description</em>}</p>
        </div>
        <div>
          <h3>AI Generated</h3>
          <p>{draft.description}</p>
        </div>
      </div>
      <div className="review-actions">
        <button onClick={() => approveDraft(product.id)}>Approve</button>
        <button onClick={() => editDraft(product.id, draft.description)}>Edit</button>
        <button onClick={() => rejectDraft(product.id)}>Reject</button>
      </div>
    </div>
  );
}
```

## Best Practices

- **Never auto-publish AI-generated content** — always route through a human review queue; AI can hallucinate specifications and make claims that create liability
- **Store drafts separately from published content** — use a `product_enrichment_drafts` table; never overwrite the published description in-place until approved
- **Use `temperature: 0.3-0.5` for descriptions** — lower temperature produces more consistent, on-brand output; very high temperature creates creative but unpredictable results
- **Set `response_format: json_object`** for extraction tasks — structured output prevents parsing failures
- **Implement concurrency limits** — OpenAI has rate limits; use a queue with configurable concurrency (5-10 parallel calls) and exponential backoff on 429 errors
- **Track enrichment quality metrics** — measure approval rate, rejection rate, and time-to-approve; use rejection notes to iterate on prompts

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| AI invents specifications not in the source data | Add explicit constraints in the system prompt: "Use only the provided attributes — do not invent values"; verify with attribute extraction on the output |
| Image tagging fails for very small or blurry images | Add a pre-check for minimum image dimensions (at least 400x400 px); skip or flag images below this threshold |
| JSON parsing fails for attribute extraction | Use `response_format: { type: 'json_object' }` and wrap parsing in try/catch with a fallback to returning empty attributes |
| Enrichment job silently drops products on API errors | Log errors per product, continue the batch, and expose the error count in the job status; do not let one failed product abort the entire run |
| Descriptions all sound the same | Add product-type-specific instructions to the prompt (e.g., different instructions for footwear vs. electronics) |

## Related Skills

- @catalog-import-export
- @product-data-modeling
- @product-categorization
- @digital-products
