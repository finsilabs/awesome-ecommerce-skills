---
name: shopify-metafields
description: "Store custom data on any Shopify resource — products, orders, customers — using typed metafield definitions accessible from Liquid and the Storefront API"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, metafields, metaobjects, custom-data, liquid, storefront-api, definitions]
triggers: ["shopify metafields", "shopify custom fields", "shopify metaobjects", "shopify metafield definition", "shopify custom data"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: beginner
---

# Shopify Metafields

## Overview

Metafields let you attach structured custom data to Shopify resources — products, variants, orders, customers, collections, and pages — without building a separate database. Metafield definitions enforce type validation (text, number, date, URL, JSON, file, product reference, etc.) and make metafields available in the Liquid template editor and Storefront API. Metaobjects extend this concept to create reusable, standalone custom data structures.

## When to Use This Skill

- When products need additional attributes beyond Shopify's default fields (care instructions, dimensions, certifications)
- When storing per-customer data such as loyalty tier, subscription status, or B2B account number
- When building content-managed sections in a theme using metafield references (FAQs, size guides, feature callouts)
- When attaching order-level custom data from checkout (gift message, delivery instructions)
- When creating reusable structured content entries with Metaobjects (team members, press mentions, specs)

## Core Instructions

1. **Create metafield definitions via the Admin API**

   Definitions enforce type and make metafields storefront-accessible:

   ```typescript
   // Create a metafield definition for product care instructions
   const response = await adminClient.request(`
     mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
       metafieldDefinitionCreate(definition: $definition) {
         createdDefinition {
           id
           name
           namespace
           key
           type { name }
         }
         userErrors { field message code }
       }
     }
   `, {
     variables: {
       definition: {
         name: "Care Instructions",
         namespace: "custom",
         key: "care_instructions",
         type: "multi_line_text_field",
         ownerType: "PRODUCT",
         description: "Washing and care instructions for the product",
         visibleToStorefrontApi: true,
         // Optional: pin to product admin UI (use pinnedPosition in API version 2023-10+)
         pinnedPosition: 1,
       },
     },
   });
   ```

   Available types: `single_line_text_field`, `multi_line_text_field`, `number_integer`, `number_decimal`, `date`, `date_time`, `boolean`, `url`, `json`, `color`, `weight`, `volume`, `dimension`, `rating`, `file_reference`, `product_reference`, `variant_reference`, `collection_reference`, `page_reference`, `metaobject_reference`, `list.<type>`.

2. **Write metafields via the Admin API**

   ```typescript
   // Set a metafield on a product
   export async function setProductMetafield(
     productId: string,
     namespace: string,
     key: string,
     value: string,
     type: string
   ) {
     const response = await adminClient.request(`
       mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
         metafieldsSet(metafields: $metafields) {
           metafields {
             id key namespace value
           }
           userErrors { field message code }
         }
       }
     `, {
       variables: {
         metafields: [
           {
             ownerId: productId,
             namespace,
             key,
             value,
             type,
           },
         ],
       },
     });
     return response.data.metafieldsSet;
   }

   // Example: Set care instructions on a product
   await setProductMetafield(
     "gid://shopify/Product/1234567890",
     "custom",
     "care_instructions",
     "Machine wash cold. Tumble dry low. Do not bleach.",
     "multi_line_text_field"
   );
   ```

3. **Read metafields in Liquid templates**

   Once a definition exists with `visibleToStorefrontApi: true`, metafields are available in Liquid via the `metafields` object:

   ```liquid
   {% comment %} product.metafields.namespace.key {% endcomment %}

   {% if product.metafields.custom.care_instructions != blank %}
     <div class="care-instructions">
       <h3>Care Instructions</h3>
       {{ product.metafields.custom.care_instructions | metafield_tag }}
     </div>
   {% endif %}

   {% comment %} Access a product reference metafield {% endcomment %}
   {% assign related = product.metafields.custom.related_product.value %}
   {% if related %}
     <a href="{{ related.url }}">{{ related.title }}</a>
   {% endif %}

   {% comment %} Access a list of file references (images) {% endcomment %}
   {% for image in product.metafields.custom.gallery_images.value %}
     <img src="{{ image | image_url: width: 800 }}" alt="{{ image.alt }}">
   {% endfor %}
   ```

4. **Read metafields via the Storefront API**

   ```typescript
   // Query product with metafields in the Storefront API
   const { data } = await storefront.request(`
     query GetProductWithMetafields($handle: String!) {
       product(handle: $handle) {
         id
         title
         # Metafields must be explicitly requested by namespace + key
         careInstructions: metafield(namespace: "custom", key: "care_instructions") {
           value
           type
         }
         relatedProduct: metafield(namespace: "custom", key: "related_product") {
           reference {
             ... on Product {
               id title handle
               featuredImage { url altText }
             }
           }
         }
         certifications: metafield(namespace: "custom", key: "certifications") {
           references(first: 5) {
             edges {
               node {
                 ... on Metaobject {
                   id
                   fields {
                     key value
                   }
                 }
               }
             }
           }
         }
       }
     }
   `, { variables: { handle: "my-product" } });
   ```

5. **Create and use Metaobjects**

   Metaobjects are standalone custom data entries — useful for FAQs, testimonials, or any structured content:

   ```typescript
   // Create a Metaobject definition
   await adminClient.request(`
     mutation {
       metaobjectDefinitionCreate(definition: {
         name: "FAQ Entry"
         type: "faq_entry"
         fieldDefinitions: [
           { name: "Question", key: "question", type: "single_line_text_field", required: true }
           { name: "Answer", key: "answer", type: "multi_line_text_field", required: true }
           { name: "Sort Order", key: "sort_order", type: "number_integer" }
         ]
       }) {
         metaobjectDefinition { id type }
         userErrors { field message }
       }
     }
   `);

   // Create a Metaobject entry
   await adminClient.request(`
     mutation {
       metaobjectCreate(metaobject: {
         type: "faq_entry"
         fields: [
           { key: "question", value: "What is your return policy?" }
           { key: "answer", value: "We accept returns within 30 days of purchase." }
           { key: "sort_order", value: "1" }
         ]
       }) {
         metaobject { id handle }
         userErrors { field message }
       }
     }
   `);
   ```

## Examples

### Bulk metafield import for product attributes

```typescript
// Import dimensions for multiple products at once (up to 25 per request)
export async function bulkSetDimensions(
  products: Array<{ id: string; weight: number; length: number; width: number; height: number }>
) {
  const metafields = products.flatMap(({ id, weight, length, width, height }) => [
    { ownerId: id, namespace: "custom", key: "weight_grams", value: weight.toString(), type: "number_integer" },
    { ownerId: id, namespace: "custom", key: "length_cm", value: length.toString(), type: "number_decimal" },
    { ownerId: id, namespace: "custom", key: "width_cm", value: width.toString(), type: "number_decimal" },
    { ownerId: id, namespace: "custom", key: "height_cm", value: height.toString(), type: "number_decimal" },
  ]);

  // Process in batches of 25 (API limit)
  for (let i = 0; i < metafields.length; i += 25) {
    const batch = metafields.slice(i, i + 25);
    await adminClient.request(`
      mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }
    `, { variables: { metafields: batch } });
  }
}
```

### Render FAQ metaobjects in Liquid

```liquid
{% comment %} sections/faq.liquid {% endcomment %}
{% assign faqs = shop.metafields.custom.faq_entries.value %}

<div class="faq-section">
  <h2>Frequently Asked Questions</h2>
  {% for faq in faqs %}
    <details class="faq-item">
      <summary>{{ faq.question.value }}</summary>
      <div class="faq-answer">{{ faq.answer.value | newline_to_br }}</div>
    </details>
  {% endfor %}
</div>
```

## Best Practices

- **Always create definitions before writing metafields** — definitions enable type validation, storefront API access, and the Admin UI field editor; undefined namespace/key combinations appear as raw JSON
- **Use the `custom` namespace for merchant-managed data** — reserve other namespaces (e.g., `app_name`) for app-owned data that merchants shouldn't edit directly
- **Set `visibleToStorefrontApi: true` on definitions** that need to be read in themes or headless frontends — metafields are private by default
- **Batch metafield writes with `metafieldsSet`** — it accepts up to 25 metafields per mutation; use it instead of individual `productUpdate` calls for bulk operations
- **Use `metafield_tag` filter in Liquid** for rich text and file reference metafields — it renders the correct HTML element (img, p, etc.) based on the metafield type
- **Prefer Metaobjects over JSON metafields** for structured multi-field data — Metaobjects are strongly typed and content-editable in the Shopify Admin UI
- **Document your namespaces** — establish a convention (`custom.*` for merchant, `yourapp.*` for app) and document keys used so developers can find them

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Metafield returns null in Storefront API | The metafield definition must have `visibleToStorefrontApi: true`; update the definition if it was created without this flag |
| `metafields.custom.key` is empty in Liquid | Ensure a definition exists for the namespace/key; Liquid only exposes metafields with registered definitions |
| List metafield value is a JSON string, not array | Use `| parse_json` filter in Liquid or `.value` property in Storefront API for list-type metafields |
| `metafieldsSet` fails with TYPE_MISMATCH | The `value` must be a JSON-serialized string matching the type — for `number_integer` pass `"42"`, not `42` |
| Metaobject fields not updating | Use `metaobjectUpdate` mutation with the metaobject GID and provide the `fields` array; partial updates are supported |
| App namespace conflicts with another app | Use your app's handle as the namespace prefix (e.g., `myapp-handle`) to avoid conflicts in shared stores |

## Related Skills

- @shopify-admin-api
- @shopify-storefront-api
- @shopify-app-development
- @shopify-theme-development
- @custom-product-attributes
