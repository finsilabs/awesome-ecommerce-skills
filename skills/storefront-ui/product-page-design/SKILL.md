---
name: product-page-design
description: "Design high-converting product detail pages with image galleries, variant selectors, social proof, and clear calls-to-action that drive add-to-cart"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product-page, ui, gallery, variants, social-proof, conversion, responsive]
triggers: ["design product page", "build product detail page", "create PDP layout", "product page components"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Page Design

## Overview

Build high-converting product detail pages (PDP) with zoomable image galleries, variant selectors (size, color, material), quantity controls, and social proof elements. This skill covers responsive layout patterns, platform-specific customization, and the component choices that drive conversion — from above-the-fold hero sections to sticky add-to-cart bars on mobile.

## When to Use This Skill

- When building a product detail page from scratch for a new storefront
- When optimizing an existing PDP for higher add-to-cart conversion rates
- When implementing a variant selector that handles multiple option types (size + color)
- When adding an image gallery with zoom, thumbnails, and swipe support
- When integrating social proof elements like reviews, ratings, and stock indicators

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Use OS2.0 theme (Dawn, Sense, Craft) and customize via Theme Editor; extend with apps for reviews (Judge.me, Loox) and variant displays | Dawn's product template handles gallery, variants, and Add to Cart out of the box; Theme Editor lets merchants configure layout without code |
| **WooCommerce** | Use WooCommerce's built-in product page with a well-supported theme (Astra, Kadence, Flatsome) + Storefront Customizer; extend with YITH, WooCommerce Product Add-Ons, and WP Review plugins | WooCommerce provides the gallery, variants (attributes + variations), and cart button natively; theme selection determines layout quality |
| **BigCommerce** | Customize the Cornerstone theme's product page via Theme Editor; use BigCommerce's built-in review system and extend with Shogun for advanced layout control | Cornerstone covers all core PDP components; BigCommerce's Theme Editor exposes layout options without code |
| **Custom / Headless** | Build a two-column grid layout with a gallery component, variant selector, sticky add-to-cart bar, and structured data for SEO | Full control over every component and interaction; see patterns below |

### Step 2: Configure the PDP layout and components

---

#### Shopify

**Layout configuration (Theme Editor):**
1. Go to **Online Store → Themes → Customize**
2. Navigate to **Products → Default product** template
3. Configure the **Product information** section:
   - Enable **Quantity selector** if you sell multi-unit products
   - Enable **Payment button** (Buy it now / Shop Pay express checkout) below Add to Cart
   - Set **Variant selector style**: Dropdown for many options, Buttons for size/color swatches
4. In the **Product media** section, set **Media size** to Large or Extra Large for better zoom quality
5. Enable the **Sticky header** option if your theme supports it — keeps Add to Cart visible on scroll

**Adding reviews (most important social proof element):**
- Install **Judge.me Product Reviews** (free tier — unlimited reviews, photo reviews) from the Shopify App Store
- Or install **Loox** (photo/video reviews with referral program, from $9.99/mo)
- Both apps inject review stars below the product title and a full reviews section at the bottom of the page with no theme code changes

**Improving variant selectors for visual products (colors/sizes):**
- Install **Variant Image Selector** or use a theme with built-in swatch support (Prestige, Impulse, Flex)
- In Dawn: go to **Theme settings → Variant pills** and enable them to replace dropdowns with clickable buttons
- For color swatches with images: use the **Variant Image** feature to assign a distinct image to each color variant; the gallery switches automatically

**Stock urgency indicator:**
- Install **Urgency Bear** or **Hurrify** app for "Only X left" badges — these read your actual Shopify inventory, not fake numbers
- Or configure inventory thresholds in **Products → [product] → Inventory** and enable the built-in low stock notification in your theme

---

#### WooCommerce

**Layout configuration:**
1. Go to **WooCommerce → Settings → Products → Display**
2. Set **Product images** size to Large (at minimum 600×600px) for zoom quality
3. Enable **Product gallery zoom** in WooCommerce settings to activate hover zoom

**Theme-level layout:**
- **Astra**: Go to **Appearance → Customize → WooCommerce → Product Page** — configure single-column or two-column layout, gallery position, and sticky Add to Cart
- **Flatsome**: Use the built-in drag-and-drop UX Builder to rearrange PDP sections; Flatsome has built-in sticky Add to Cart and swatch selectors
- **Kadence**: In **Kadence → WooCommerce** settings, enable sticky Add to Cart, set gallery layout (vertical thumbnails, horizontal strip), and configure review stars placement

**Adding reviews:**
- Install **WooCommerce Product Reviews Pro** (WooCommerce.com, $79/yr) for photo reviews, review reminders, and helpful votes
- Or use **Customer Reviews for WooCommerce** (free) which integrates with Trustpilot and Google Shopping

**Variant selectors (color swatches, size buttons):**
- Install **Variation Swatches for WooCommerce** (free, WordPress.org) — converts attribute dropdowns to visual swatches (color, image, or button style)
- Configure swatch type per attribute in **Products → Attributes → [attribute] → Swatch type**

---

#### BigCommerce

**Layout configuration (Cornerstone theme):**
1. Go to **Storefront → My Themes → Customize**
2. Under **Product Page**, configure:
   - **Image layout**: Carousel, Thumbnail strip vertical, or Thumbnail strip horizontal
   - **Gallery zoom**: Enable hover zoom
   - **Product options** display: Dropdown or Swatch buttons per option type
3. Enable **Sticky Add to Cart** if your theme version supports it (Cornerstone 6+)

**Reviews:**
1. Go to **Storefront → Product Reviews** and enable the built-in review system
2. Set minimum review length and whether reviews require approval before publishing
3. For advanced review features (photo reviews, Q&A, review emails): install **PowerReviews** or **Yotpo** from the BigCommerce App Marketplace

**Social proof apps:**
- **Judge.me** and **Loox** are available for BigCommerce in addition to Shopify

---

#### Custom / Headless

**Two-column responsive PDP layout:**
```css
.pdp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .pdp-grid { grid-template-columns: 1fr; }
}

/* Gallery sticks while scrolling through product info on desktop */
.pdp-gallery { position: sticky; top: 2rem; align-self: start; }
```

**Variant selector with availability tracking:**
```jsx
// VariantSelector.jsx — uses radio inputs for accessibility
function VariantSelector({ product, selectedOptions, onOptionChange }) {
  function isAvailable(optionName, value) {
    return product.variants.some(v =>
      v.options[optionName] === value &&
      v.inventory > 0 &&
      Object.entries(selectedOptions).every(([k, sv]) =>
        k === optionName || v.options[k] === sv
      )
    );
  }

  return (
    <div className="variant-selector">
      {product.optionNames.map(optionName => (
        <fieldset key={optionName}>
          <legend>{optionName}: <strong>{selectedOptions[optionName]}</strong></legend>
          {product.optionValues[optionName].map(value => (
            <label key={value} className={!isAvailable(optionName, value) ? 'unavailable' : ''}>
              <input type="radio" name={optionName} value={value}
                checked={selectedOptions[optionName] === value}
                disabled={!isAvailable(optionName, value)}
                onChange={() => onOptionChange(optionName, value)}
                className="sr-only" />
              <span className="option-btn">{value}</span>
              {!isAvailable(optionName, value) && <span className="sr-only"> (out of stock)</span>}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
```

**Sticky Add to Cart bar (appears when primary button scrolls out of view):**
```jsx
function StickyBuyBar({ product, selectedVariant, onAddToCart }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById('main-add-to-cart');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return visible ? (
    <div className="sticky-buy-bar" role="complementary" aria-label="Add to cart">
      <span>{product.name}</span>
      <span>${selectedVariant?.price ?? product.price}</span>
      <button onClick={onAddToCart} disabled={!selectedVariant || selectedVariant.inventory <= 0}>
        {selectedVariant?.inventory <= 0 ? 'Sold Out' : 'Add to Cart'}
      </button>
    </div>
  ) : null;
}
```

**Product structured data for SEO (JSON-LD):**
```javascript
// Build server-side to avoid client-side injection
function buildProductSchema(product, reviews) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(i => i.src),
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...product.variants.map(v => v.price)).toFixed(2),
      priceCurrency: 'USD',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(reviews.totalCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.averageRating.toFixed(1),
        reviewCount: reviews.totalCount,
      },
    }),
  };
}
```

### Step 3: Add social proof and trust signals

Regardless of platform, these elements directly improve add-to-cart conversion:

1. **Star ratings near the title** — place review average and count immediately below the product name, above the price
2. **Stock indicators** — show "Only 3 left" only when inventory is genuinely low (under 10 units); never fake urgency
3. **Trust badges** — secure checkout, free returns, and warranty symbols near the Add to Cart button; most themes have a trust badge section or use a free app
4. **Recent purchase notifications** — apps like **Sales Pop** (Shopify) or **WooCommerce Sales Popup** show "Someone in [city] bought this 2 hours ago" — use with real data only

## Best Practices

- **Prioritize above-the-fold content** — title, price, main image, and Add to Cart button should be visible without scrolling on desktop
- **Use semantic HTML for variant selectors** — `<fieldset>/<legend>/<input type="radio">` pattern, not clickable `<div>` elements; screen readers navigate by this
- **Lazy-load below-the-fold images** — only the hero image uses `loading="eager"`; thumbnails and secondary images use `loading="lazy"`
- **Show compare-at prices clearly** — display the original price with a strikethrough next to the sale price
- **Disable, don't hide, out-of-stock variants** — show them as disabled so users understand what exists in the product
- **Use real inventory data for urgency** — never fake "only 3 left" messaging; use actual stock counts or remove the indicator

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CLS from image loading | Set explicit `width` and `height` on images, or use `aspect-ratio` on the container |
| Variant selector doesn't update the URL | Use `replaceState` to update the URL with the selected variant ID so the page is shareable |
| Add-to-cart button hidden on long pages (mobile) | Implement a sticky add-to-cart bar that appears when the main button scrolls out of view |
| Gallery images load slowly on mobile | Serve responsive images with `srcset` and use WebP/AVIF formats |
| Reviews section causes long initial load | Lazy-load reviews — initialize the section only when the user scrolls near it |

## Related Skills

- @image-zoom-360
- @responsive-storefront
- @accessibility-commerce
- @checkout-flow-optimization
- @search-autocomplete
