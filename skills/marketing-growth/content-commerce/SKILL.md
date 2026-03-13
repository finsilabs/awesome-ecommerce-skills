---
name: content-commerce
description: "Turn your blog into a sales channel by embedding shoppable product cards in editorial content and tracking content-influenced revenue"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [content-commerce, shoppable-content, blog, editorial, seo, product-embedding, cms, headless]
triggers: ["content commerce", "shoppable blog", "shoppable content", "editorial merchandising", "blog to commerce", "product embedding in blog"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Content Commerce

## Overview

Content commerce bridges editorial content — blog posts, buying guides, lookbooks — with direct product purchasing, capturing high-intent organic traffic and shortening the path from discovery to purchase. Shopify and WooCommerce both have built-in blog functionality where you can link products directly; headless setups require a CMS integration. The key goal is making it easy for your editorial team to embed products without engineering help, and tracking which content pieces actually drive revenue.

## When to Use This Skill

- When a blog drives significant organic traffic but contributes little to revenue
- When editorial team needs a no-code way to embed products inside articles
- When implementing SEO-optimized buying guides that rank for "best [product category]" queries
- When building a lookbook or collection page with editorial text and shoppable product grids
- When needing to track which content pieces drive the most revenue

## Core Instructions

### Step 1: Determine the merchant's platform and content setup

| Platform | Content Tool | Shoppable Embedding Approach |
|----------|-------------|------------------------------|
| **Shopify** | Shopify Blog (built-in) | Use Shogun or PageFly page builder to embed product cards; or use Shopify's native blog with manual product links |
| **WooCommerce** | WordPress native blog | Use WooCommerce product blocks (Gutenberg) or WooCommerce Shortcodes to embed products inline |
| **BigCommerce** | BigCommerce Blog or WordPress | WordPress: use WooCommerce Shortcodes or a product block plugin; BigCommerce blog: manual product linking only |
| **Headless / Custom CMS** | Contentful, Sanity, Prismic | Build a product embed component using the CMS's custom content type system and Storefront API |

### Step 2: Set up shoppable content

---

#### Shopify

**Option A: Shopify Blog with native product links (free, simple)**

1. Go to **Shopify Admin → Online Store → Blog Posts**
2. In any blog post, highlight text and click the link icon to link to a product page (e.g., `/products/product-handle`)
3. To embed a product image with a buy button, use a section or block in your theme:
   - Go to **Online Store → Themes → Customize**
   - On the blog post template, add a "Product" or "Featured Product" section and configure it for each post
4. Limitations: no inline product cards; products appear as separate sections above/below the article body

**Option B: Shogun or PageFly (recommended for buying guides)**

1. Install **Shogun** or **PageFly** from the Shopify App Store
2. Create a new landing page for your buying guide or lookbook
3. Drag and drop **Product Card** elements directly into the editorial content
4. Each product card shows image, price, and "Add to Cart" button with live Shopify inventory
5. Publish the page and link to it from your blog or navigation

**Option C: Instant (previously known as EcomSend) — for in-blog product embeds**

1. Install the Instant page builder app
2. Use the blog post editor to add product cards inline within article text

---

#### WooCommerce

**Using Gutenberg product blocks (built-in with WooCommerce):**

1. Open any WordPress post in the Gutenberg editor
2. Click the + block button and search for "Products"
3. Insert a **Products (Beta)** block or **Hand-picked Products** block
4. Search for products by name and select them — a product grid with prices and "Add to Cart" appears inline in the article
5. For a single inline product card, use the **Single Product** block

**Using WooCommerce Shortcodes (classic editor):**

Insert a product anywhere in article text:
```
[product id="123"]
[products ids="123,456,789" columns="3"]
[product_page id="123"]
```

---

#### BigCommerce

1. For BigCommerce's built-in blog, you are limited to manual product links — no native product embed blocks
2. **Recommended**: run WordPress on a subdomain (`blog.yourstore.com`) with the BigCommerce for WordPress plugin
3. This gives you Gutenberg product blocks (same as WooCommerce setup above) while the main store runs on BigCommerce

---

#### Custom / Headless

For headless setups with Contentful, Sanity, or Prismic, build a product embed content type:

**Sanity schema for a product embed:**
```typescript
// schemas/productEmbed.ts
export const productEmbedType = {
  name: 'productEmbed',
  title: 'Product Embed',
  type: 'object',
  fields: [
    {
      name: 'productId',
      title: 'Product ID',
      type: 'string',
      description: 'Shopify/BigCommerce product ID or handle',
    },
    {
      name: 'displayStyle',
      title: 'Display Style',
      type: 'string',
      options: { list: ['card', 'inline', 'full'] },
      initialValue: 'card',
    },
    {
      name: 'ctaText',
      title: 'CTA Text',
      type: 'string',
      initialValue: 'Shop Now',
    },
  ],
};
```

React component that fetches live price and inventory from the Storefront API:
```tsx
export function ProductEmbed({ productId, displayStyle, ctaText, articleSlug }: ProductEmbedProps) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}?fields=name,price,images,slug,inStock`)
      .then(r => r.json())
      .then(setProduct);
  }, [productId]);

  if (!product) return <div className="product-embed-skeleton" />;

  return (
    <div className={`product-embed product-embed--${displayStyle}`}>
      <img src={product.images[0]?.url} alt={product.name} />
      <div className="product-embed__info">
        <h3>{product.name}</h3>
        <p>${(product.priceInCents / 100).toFixed(2)}</p>
        {!product.inStock && <span>Out of stock</span>}
      </div>
      <a href={`/products/${product.slug}?utm_source=content&utm_campaign=${articleSlug}`}>
        {ctaText}
      </a>
    </div>
  );
}
```

### Step 3: Add UTM attribution to all content links

Append UTM parameters to every product link within content so you can track which articles drive revenue in Google Analytics:

- For Shopify/WooCommerce native embeds: add `?utm_source=content&utm_medium=blog&utm_campaign=ARTICLE-SLUG` to product URLs manually or via a theme setting
- For Shogun/PageFly: each button has a URL field — include UTM params there
- For headless: build UTM parameters into the product embed component automatically using the article slug

### Step 4: Track content-driven revenue

In **Google Analytics 4**:
1. Go to **Reports → Acquisition → Traffic Acquisition**
2. Filter by `Session source = content` to see all orders attributed to blog content
3. For more detail: go to **Explore → Funnel Exploration** and filter by `utm_medium = blog`

In **Shopify Analytics**:
1. Go to **Analytics → Reports → Sales by traffic source**
2. Filter by source to see UTM-tagged content traffic

## Best Practices

- **Fetch product prices live** — never hardcode prices in CMS content; prices change and stale prices erode trust
- **Show "Out of Stock" state** in product embeds — a broken-looking card hurts conversion more than no card at all
- **Place product embeds high in the article** — data shows most readers don't scroll past 60% of an article; embed the first product recommendation within the first 400 words
- **Use UTM `utm_content` = product slug** — this lets you see which specific product in an article drove the conversion, not just which article
- **Give editorial team a product search tool** — in Shopify, editors can search products by name when building pages in Shogun/PageFly; do not require them to know product IDs

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Product prices in articles are stale | Always fetch prices from the storefront API at render time; never embed prices as static CMS content |
| Out-of-stock products remain embedded in live articles | Add an inventory check in your product embed component; show "notify me" or a related product instead |
| CMS editors can't find products to embed | Use Shogun/PageFly's product search widget; for headless, build a product picker that queries the Storefront API |
| Content attribution double-counts — same order attributed to both content and email | In GA4, use last non-direct click as the attribution model, or manually review multi-touch paths in the Path Exploration report |
| Buying guide SEO titles not ranking | Ensure article titles match the exact query format ("Best [Product Type] for [Use Case] in [Year]") and include product schema.org markup |

## Related Skills

- @social-commerce
- @influencer-tracking
- @ecommerce-seo
- @email-marketing-automation
- @marketing-attribution-dashboard
