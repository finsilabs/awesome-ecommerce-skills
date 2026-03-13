---
name: product-categorization
description: "Build a clean product hierarchy with collections, categories, tags, and breadcrumb navigation using your platform's native tools"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [categories, taxonomy, breadcrumbs, seo, hierarchy, auto-categorization, navigation]
triggers: ["product categories", "category hierarchy", "product taxonomy", "breadcrumb navigation", "auto-categorize products", "category SEO"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Categorization

## Overview

A well-structured product taxonomy makes products findable and drives SEO through category pages. Every platform handles categorization differently: Shopify uses Collections and tags, WooCommerce uses hierarchical Categories and tags, and BigCommerce uses Categories with subcategories. Understanding the platform's native model and configuring it correctly is more impactful than building a custom taxonomy system.

## When to Use This Skill

- When building a product catalog that needs a navigable category tree (clothing > women > dresses)
- When migrating a flat product list into a structured taxonomy
- When breadcrumb navigation is missing or generating wrong paths
- When category pages need SEO-optimized URLs and meta tags
- When ingesting large supplier catalogs that need automatic categorization

## Core Instructions

### Step 1: Understand how your platform handles categories

| Platform | Category Model | URL Structure |
|----------|---------------|---------------|
| **Shopify** | Collections (flat or nested via themes); tags for additional filtering | `/collections/womens-dresses` |
| **WooCommerce** | Hierarchical categories (parent/child) + tags | `/product-category/clothing/womens/dresses/` |
| **BigCommerce** | Nested categories (unlimited depth) | `/clothing/womens/dresses/` |
| **Custom / Headless** | Build with materialized paths for efficient breadcrumb queries | `/c/clothing/women/dresses` |

Choose a depth strategy before building:
- **2–3 levels** is optimal for most stores (e.g., Clothing → Womens → Dresses)
- **4 levels maximum** — deeper hierarchies confuse shoppers and dilute SEO
- **Flat + tags** works well for small catalogs (under 200 products)

---

### Step 2: Platform-specific setup

---

#### Shopify

Shopify uses **Collections** as the primary categorization mechanism. Collections can be manual (hand-curated) or automated (rules-based).

**Creating a collection hierarchy:**

1. Go to **Admin → Products → Collections → Create collection**
2. For the "Women's Dresses" example:
   - Create a parent collection: "Clothing" (manual, for navigation menu)
   - Create a child collection: "Women's Dresses" (automated, rule: tag contains `womens-dress`)
3. Set the collection's SEO fields: **Title**, **Meta description**, and **URL handle**
4. Add a collection image and description — these improve SEO and conversion on the collection page

**Automated collections (rule-based — recommended):**
- Set rules like: Product type equals "Dress" AND tags contain "womens"
- Products matching the rules are automatically added — no manual curation needed
- Best for large catalogs where you can't manually assign every product

**Manual collections:**
- Best for curated edits (e.g., "Summer Picks", "Staff Favorites")
- Add products by hand from the collection edit page

**Navigation menu hierarchy:**

1. Go to **Online Store → Navigation**
2. Open the main menu
3. Add each collection as a menu item; nest items by dragging sub-items under parent items
4. This creates the visual hierarchy in your storefront's navigation even though Shopify collections are technically flat

**Tags for additional filtering:**
- Add product tags like `color-red`, `size-M`, `material-cotton`
- Use a faceted filtering app (Boost Commerce, Searchpie) to turn tags into filterable attributes on collection pages

**Breadcrumbs:**
Most Shopify themes include breadcrumbs automatically. If not:
- Go to **Online Store → Themes → Customize**
- Search for "breadcrumb" in theme settings — many themes have a toggle
- For Dawn/Debut: breadcrumbs are theme-specific and may need liquid code changes

---

#### WooCommerce

WooCommerce has hierarchical product categories — the closest to a traditional category tree.

**Create a category hierarchy:**

1. Go to **Products → Categories → Add New Category**
2. Create your top-level category: "Clothing"
3. Create a child category: "Women's" — select "Clothing" as the Parent Category
4. Create a grandchild: "Dresses" — select "Women's" as the Parent

WooCommerce generates SEO-friendly URLs automatically:
- Clothing: `/product-category/clothing/`
- Women's: `/product-category/clothing/womens/`
- Dresses: `/product-category/clothing/womens/dresses/`

**Assign products to categories:**

1. Open a product and go to the **Product Categories** widget in the sidebar
2. Check all applicable categories (products can belong to multiple categories)
3. Check the **Primary category** for breadcrumb display (requires Yoast SEO)

**Category page SEO:**

1. Edit a category: **Products → Categories → [Category] → Edit**
2. Set a **Description** (unique text appears above the product grid — important for SEO)
3. Upload a **Thumbnail** image
4. With **Yoast SEO**: scroll to the Yoast section on the category edit page and set **SEO title** and **Meta description** for each category

**Breadcrumbs:**
- Install **Yoast SEO** (free) — it adds breadcrumb navigation automatically
- Or enable breadcrumbs in **WooCommerce → Settings → Advanced → Breadcrumbs**
- Configure the breadcrumb separator and home label

---

#### BigCommerce

BigCommerce has a nested category system with unlimited depth.

**Create categories:**

1. Go to **Products → Product Categories → Add**
2. Enter the category name, description, and URL (BigCommerce lets you customize the URL)
3. Select a **Parent category** to nest it
4. Upload a category image
5. Set **SEO Title** and **Meta description** for each category

**Assign products to categories:**
1. Edit a product
2. Under **Categories**, check all applicable categories
3. BigCommerce supports assigning a product to multiple categories

**Category sort order:**
- Set sort order per category: manual, price ascending/descending, newest, bestselling
- Configure under the category edit page → **Sort Products By**

**Breadcrumbs:**
BigCommerce themes include breadcrumbs by default, automatically following the nested category path. Customize the breadcrumb template in your theme's Stencil files if needed.

---

#### Custom / Headless

For headless storefronts, use a materialized path model for efficient breadcrumb queries:

```typescript
// Category model with materialized path
interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  path: string;       // e.g., "clothing/women/dresses" — ancestor slugs joined by /
  pathIds: string[];  // IDs for fast joins: ['cat_root', 'cat_clothing', 'cat_women', 'cat_dresses']
  depth: number;
  position: number;   // Sort order among siblings
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

// Get breadcrumbs in one query using materialized path
export async function getCategoryWithBreadcrumb(slug: string) {
  const category = await db.categories.findUnique({ where: { slug } });
  if (!category) return null;

  // Fetch all ancestors in one query using pathIds
  const ancestors = await db.categories.findMany({
    where: { id: { in: category.pathIds.slice(0, -1) } },
    orderBy: { depth: 'asc' },
  });

  return {
    ...category,
    breadcrumbs: [
      ...ancestors.map(a => ({ name: a.name, url: `/c/${a.path}` })),
      { name: category.name, url: `/c/${category.path}` },
    ],
  };
}

// Update materialized paths when a category is moved
export async function moveCategory(categoryId: string, newParentId: string | null) {
  const category = await db.categories.findUnique({ where: { id: categoryId } });
  const newParent = newParentId ? await db.categories.findUnique({ where: { id: newParentId } }) : null;

  const newPath = newParent ? `${newParent.path}/${category.slug}` : category.slug;
  const newPathIds = newParent ? [...newParent.pathIds, categoryId] : [categoryId];

  // Update this category and all descendants in a transaction
  const descendants = await db.categories.findMany({ where: { path: { startsWith: category.path + '/' } } });

  await db.$transaction([
    db.categories.update({
      where: { id: categoryId },
      data: { parentId: newParentId, path: newPath, pathIds: newPathIds, depth: newPath.split('/').length },
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

---

### Step 3: Optimize category pages for SEO

Regardless of platform, every category page needs:

1. **Unique description**: 100–200 words of original text describing what's in this category. "Shop women's dresses" is not enough — describe the styles, materials, occasions.
2. **Category image**: A hero or banner image relevant to the category
3. **SEO title**: Format — `[Category Name] | [Store Name]` (e.g., "Women's Dresses | YourStore")
4. **Meta description**: 150–160 characters highlighting what makes your selection unique
5. **Canonical URL**: The category's clean URL without filter parameters (e.g., `/clothing/womens/dresses`, not `/clothing/womens/dresses?color=red`)

**Canonical URLs for filtered pages:**
- Shopify: themes handle this automatically for collection pages
- WooCommerce + Yoast SEO: Yoast sets the canonical automatically
- BigCommerce: set canonicals in category settings

---

### Step 4: Bulk-assign categories for large catalogs

For catalogs with hundreds or thousands of products to categorize:

**Shopify:**
- In Admin → Products, select multiple products using the checkboxes
- Click **Bulk actions → Add to collection** to assign them all at once
- For automated collections, products are assigned automatically when they match the rules

**WooCommerce:**
- Use **WP All Import** to bulk-assign categories via CSV
- Or use the Products Bulk Edit in WooCommerce admin

**AI-assisted categorization (any platform):**
- Export your product catalog with titles and descriptions
- Use an AI tool to suggest categories based on product content
- Import the suggested categories back in bulk using Matrixify (Shopify) or WP All Import (WooCommerce)
- Always review AI suggestions for accuracy before publishing

## Best Practices

- **Use automated (rule-based) collections on Shopify** for the main taxonomy — they self-update as products are added; manual collections are for curated editorial picks
- **Write unique descriptions for every category page** — pages without descriptions are thin content and rarely rank; even 100 words of original text makes a meaningful SEO difference
- **Limit depth to 3 levels** for most stores — the extra specificity of level 4 rarely helps SEO and creates navigation complexity
- **Use tags for cross-cutting attributes** (color, material, occasion) rather than categories — tags power faceted filtering without multiplying your category tree
- **Update paths in a transaction when moving categories** — a partially updated tree creates broken breadcrumbs; always update the category and all its descendants atomically

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Breadcrumb shows wrong category | On WooCommerce, install Yoast SEO and set the primary category per product; without a primary category, the breadcrumb may show any assigned category |
| Shopify collection page has no unique content | Add a collection description in Admin → Collections → [Collection] → Description; many merchants leave this blank and miss an SEO opportunity |
| Duplicate content on category + filtered URLs | Set canonical tags pointing to the clean category URL for all filter variations; block crawling of paginated pages beyond page 2 |
| Products assigned to too many categories | Each product should have one primary category plus optional secondary ones; too many categories dilutes the signals and confuses navigation |
| Category rename breaks existing links | When renaming, set up a URL redirect from the old URL to the new URL; all platforms support redirects in settings |

## Related Skills

- @product-data-modeling
- @product-content-enrichment
- @catalog-import-export
