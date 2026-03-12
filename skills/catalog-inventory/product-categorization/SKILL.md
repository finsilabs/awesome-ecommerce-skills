---
name: product-categorization
description: "Hierarchical taxonomy design with breadcrumbs, auto-categorization, and SEO"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [categories, taxonomy, breadcrumbs, seo, hierarchy, auto-categorization, navigation]
triggers: ["product categories", "category hierarchy", "product taxonomy", "breadcrumb navigation", "auto-categorize products", "category SEO"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Categorization

## Overview

Design and implement a hierarchical product taxonomy that scales to thousands of categories while staying fast to query. Covers the adjacency list vs. materialized path data models, breadcrumb generation, URL slug strategies for SEO, and AI-assisted auto-categorization for bulk product ingestion.

## When to Use This Skill

- When building a product catalog that needs a navigable category tree (clothing > women > dresses)
- When migrating a flat product list into a structured taxonomy
- When breadcrumb navigation is missing or generating wrong paths
- When category pages need SEO-optimized URLs and meta tags
- When ingesting large supplier catalogs that need automatic categorization

## Core Instructions

1. **Design the category data model with materialized paths**

   Materialized paths store the full ancestry path on each row, making breadcrumb queries O(1) and subtree queries efficient without recursive CTEs.

   ```javascript
   // categories table
   {
     id: 'cat_dresses',
     name: 'Dresses',
     slug: 'dresses',
     parent_id: 'cat_women',
     path: 'clothing/women/dresses',          // Materialized path — ancestor slugs joined by /
     path_ids: ['cat_root','cat_clothing','cat_women','cat_dresses'], // IDs for fast joins
     depth: 3,
     position: 2,                             // Sort order among siblings
     published: true,
     seo_title: 'Shop Women\'s Dresses | Your Store',
     seo_description: 'Browse 500+ dresses...',
     image_url: '/images/categories/dresses.jpg',
   }
   ```

2. **Efficiently query categories with breadcrumbs**

   ```javascript
   // lib/categories.js

   // Get the full breadcrumb for a category in one query using materialized path
   export async function getCategoryWithBreadcrumb(slug) {
     const category = await db.categories.findUnique({ where: { slug } });
     if (!category) return null;

     // Breadcrumb ancestors are stored in path_ids — fetch all in one query
     const ancestors = await db.categories.findMany({
       where: { id: { in: category.pathIds.slice(0, -1) } },  // Exclude self
       orderBy: { depth: 'asc' },
     });

     return {
       ...category,
       breadcrumbs: [
         ...ancestors.map(a => ({ name: a.name, slug: a.slug, url: `/c/${a.path}` })),
         { name: category.name, slug: category.slug, url: `/c/${category.path}` },
       ],
     };
   }

   // Get the full category tree (for mega menu or sitemap)
   export async function getCategoryTree(rootSlug = null) {
     const all = await db.categories.findMany({
       where: { published: true },
       orderBy: [{ depth: 'asc' }, { position: 'asc' }],
     });

     // Build tree from flat list
     const map = new Map(all.map(c => [c.id, { ...c, children: [] }]));
     const roots = [];
     for (const cat of map.values()) {
       if (cat.parentId) {
         map.get(cat.parentId)?.children.push(cat);
       } else {
         roots.push(cat);
       }
     }
     return roots;
   }
   ```

3. **Maintain materialized paths on category moves**

   When a category is moved to a new parent, update the path of the entire subtree.

   ```javascript
   export async function moveCategory(categoryId, newParentId) {
     const category = await db.categories.findUnique({ where: { id: categoryId } });
     const newParent = newParentId
       ? await db.categories.findUnique({ where: { id: newParentId } })
       : null;

     const newPath = newParent
       ? `${newParent.path}/${category.slug}`
       : category.slug;
     const newPathIds = newParent
       ? [...newParent.pathIds, categoryId]
       : [categoryId];

     // Update this category and all descendants
     const descendants = await db.categories.findMany({
       where: { path: { startsWith: category.path + '/' } },
     });

     await db.$transaction([
       db.categories.update({
         where: { id: categoryId },
         data: {
           parentId: newParentId,
           path: newPath,
           pathIds: newPathIds,
           depth: newPath.split('/').length,
         },
       }),
       ...descendants.map(desc => db.categories.update({
         where: { id: desc.id },
         data: {
           path: desc.path.replace(category.path, newPath),
           pathIds: [...newPathIds, ...desc.pathIds.slice(category.pathIds.length)],
           depth: desc.path.replace(category.path, newPath).split('/').length,
         },
       })),
     ]);
   }
   ```

4. **Implement AI-assisted auto-categorization**

   For bulk imports, use an LLM to suggest categories based on product title and description.

   ```javascript
   // lib/autoCategorize.js
   import OpenAI from 'openai';

   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   export async function suggestCategories(product, categoryTree) {
     const categoryList = flattenTree(categoryTree)
       .map(c => `${c.id}: ${c.path} (${c.name})`)
       .join('\n');

     const response = await openai.chat.completions.create({
       model: 'gpt-4o-mini',
       messages: [
         {
           role: 'system',
           content: `You are a product categorization assistant. Given a product and a list of categories, return the 1-3 most appropriate category IDs as a JSON array. Only return valid IDs from the list provided.`,
         },
         {
           role: 'user',
           content: `Product: ${product.title}\nDescription: ${product.description}\n\nCategories:\n${categoryList}\n\nReturn JSON: { "categoryIds": ["cat_id1", "cat_id2"] }`,
         },
       ],
       response_format: { type: 'json_object' },
       temperature: 0.1,
     });

     const result = JSON.parse(response.choices[0].message.content);
     return result.categoryIds ?? [];
   }

   function flattenTree(nodes, acc = []) {
     for (const node of nodes) {
       acc.push(node);
       if (node.children?.length) flattenTree(node.children, acc);
     }
     return acc;
   }
   ```

5. **Generate SEO-optimized category page meta tags**

   ```javascript
   // lib/categorySeo.js
   export function getCategoryMeta(category, productCount) {
     const title = category.seoTitle ??
       `Shop ${category.name} | ${process.env.STORE_NAME}`;
     const description = category.seoDescription ??
       `Browse ${productCount.toLocaleString()} ${category.name.toLowerCase()} products. Free shipping on orders over $50.`;

     return {
       title,
       description,
       canonical: `https://${process.env.STORE_DOMAIN}/c/${category.path}`,
       openGraph: {
         title,
         description,
         image: category.imageUrl,
         type: 'website',
       },
       structuredData: {
         '@context': 'https://schema.org',
         '@type': 'CollectionPage',
         name: category.name,
         description,
         url: `https://${process.env.STORE_DOMAIN}/c/${category.path}`,
         breadcrumb: {
           '@type': 'BreadcrumbList',
           itemListElement: category.breadcrumbs.map((crumb, i) => ({
             '@type': 'ListItem',
             position: i + 1,
             name: crumb.name,
             item: `https://${process.env.STORE_DOMAIN}${crumb.url}`,
           })),
         },
       },
     };
   }
   ```

## Examples

### Breadcrumb component with structured data

```jsx
function Breadcrumbs({ breadcrumbs }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumbs" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbs.map((crumb, i) => (
          <li key={crumb.url} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            {i < breadcrumbs.length - 1 ? (
              <a href={crumb.url} itemProp="item">
                <span itemProp="name">{crumb.name}</span>
              </a>
            ) : (
              <span itemProp="name" aria-current="page">{crumb.name}</span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Category URL structure

```
/c/clothing                           → Top-level category
/c/clothing/women                     → Level 2
/c/clothing/women/dresses             → Level 3 (leaf)
/c/clothing/women/dresses?color=red   → Faceted filter on leaf category
```

Rules:
- Keep paths short (max 3-4 levels) for both UX and SEO
- Use hyphens in slugs (not underscores): `evening-dresses` not `evening_dresses`
- Avoid stop words in slugs when possible: `womens-dresses` not `for-women-dresses`

## Best Practices

- **Use materialized paths, not recursive CTEs** — querying ancestry with recursive SQL is slower and harder to index; materialized paths allow O(1) breadcrumb retrieval
- **Slugs must be unique within a parent** — not globally; `/clothing/pants` and `/furniture/pants` can coexist
- **Update materialized paths in a transaction when moving categories** — a partially updated tree causes broken breadcrumbs
- **Implement category images and descriptions** — category pages with unique content outperform generic product listings in organic search
- **Limit category depth to 4 levels** — deeper hierarchies confuse shoppers and dilute SEO link equity
- **Use AI auto-categorization as a suggestion, not a final decision** — require human review for products that the model is uncertain about (low confidence score)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Breadcrumb generates wrong path after category rename | Re-compute materialized path when slug changes; update all descendants' paths in the same transaction |
| Duplicate slugs within the same parent | Add a unique database constraint on `(parent_id, slug)` |
| Category move leaves orphaned product associations | When archiving a category, reassign its products to the parent category or require the operator to reassign first |
| SEO: duplicate content on category + faceted URLs | Add `rel="canonical"` pointing to the unfaceted category URL for facet combinations; block non-primary combinations in `robots.txt` |
| Performance: loading entire category tree on every page | Cache the tree in Redis with a 5-minute TTL; invalidate on any category update |

## Related Skills

- @faceted-navigation
- @product-data-modeling
- @search-autocomplete
- @mega-menu-builder
