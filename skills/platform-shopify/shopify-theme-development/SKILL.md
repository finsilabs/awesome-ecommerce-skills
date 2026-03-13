---
name: shopify-theme-development
description: "Build and customize Shopify themes using Liquid templating, JSON sections, dynamic blocks, and theme app extensions for added functionality"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, liquid, theme, sections, blocks, dawn, theme-app-extensions]
triggers: ["build shopify theme", "customize shopify template", "shopify liquid code", "create shopify section"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: intermediate
---

# Shopify Theme Development

## Overview

Build and customize Shopify themes using Liquid templating, JSON templates, sections and blocks for merchant-customizable layouts, and theme app extensions for app integrations. This skill covers the Shopify theme architecture (Online Store 2.0), the Shopify CLI development workflow, performance optimization with lazy loading and critical CSS, and patterns for building flexible sections that merchants can configure through the theme editor.

## When to Use This Skill

- When building a new Shopify theme from scratch or forking Dawn
- When creating custom sections and blocks for the theme editor
- When implementing product pages, collection grids, or cart functionality in Liquid
- When optimizing a Shopify theme for Core Web Vitals and speed
- When building theme app extensions to inject app content into themes

## Core Instructions

1. **Set up the development environment with Shopify CLI**

   ```bash
   # Install Shopify CLI
   npm install -g @shopify/cli @shopify/theme

   # Initialize a new theme (or clone Dawn)
   shopify theme init my-theme

   # Start development server with hot reload
   shopify theme dev --store=your-store.myshopify.com
   ```

   Theme directory structure (Online Store 2.0):
   ```
   my-theme/
   ├── assets/          # CSS, JS, images
   ├── config/          # settings_schema.json, settings_data.json
   ├── layout/          # theme.liquid (main layout)
   ├── locales/         # Translation files
   ├── sections/        # Sections (reusable, merchant-configurable)
   ├── snippets/        # Partials (reusable Liquid fragments)
   └── templates/       # JSON templates referencing sections
       ├── product.json
       ├── collection.json
       └── index.json
   ```

2. **Create a JSON template with sections**

   ```json
   // templates/product.json
   {
     "sections": {
       "main": {
         "type": "main-product",
         "settings": {}
       },
       "recommendations": {
         "type": "product-recommendations",
         "settings": {
           "heading": "You may also like",
           "products_to_show": 4
         }
       },
       "reviews": {
         "type": "product-reviews",
         "settings": {}
       }
     },
     "order": ["main", "recommendations", "reviews"]
   }
   ```

3. **Build a customizable product section with blocks**

   ```liquid
   {% comment %}
     sections/main-product.liquid
   {% endcomment %}

   <section class="product-section" data-section-id="{{ section.id }}">
     <div class="product-grid">
       <div class="product-media">
         {% for media in product.media %}
           {% case media.media_type %}
             {% when 'image' %}
               <div class="product-media-item {% if forloop.first %}active{% endif %}">
                 {{ media | image_url: width: 800 | image_tag:
                   loading: 'lazy',
                   widths: '200,400,600,800,1000',
                   sizes: '(min-width: 768px) 50vw, 100vw',
                   class: 'product-image'
                 }}
               </div>
             {% when 'video' %}
               <div class="product-media-item">
                 {{ media | video_tag: autoplay: false, controls: true }}
               </div>
           {% endcase %}
         {% endfor %}
       </div>

       <div class="product-info">
         {% for block in section.blocks %}
           {% case block.type %}
             {% when 'title' %}
               <h1 class="product-title" {{ block.shopify_attributes }}>
                 {{ product.title }}
               </h1>

             {% when 'price' %}
               <div class="product-price" {{ block.shopify_attributes }}>
                 {% if product.compare_at_price > product.price %}
                   <s class="price-compare">{{ product.compare_at_price | money }}</s>
                 {% endif %}
                 <span class="price-current">{{ product.price | money }}</span>
                 {% if product.compare_at_price > product.price %}
                   <span class="price-badge">Sale</span>
                 {% endif %}
               </div>

             {% when 'variant_picker' %}
               <div class="variant-picker" {{ block.shopify_attributes }}>
                 {% for option in product.options_with_values %}
                   <fieldset class="option-group">
                     <legend>{{ option.name }}</legend>
                     {% for value in option.values %}
                       <label class="option-label">
                         <input
                           type="radio"
                           name="{{ option.name }}"
                           value="{{ value }}"
                           {% if option.selected_value == value %}checked{% endif %}
                         >
                         <span>{{ value }}</span>
                       </label>
                     {% endfor %}
                   </fieldset>
                 {% endfor %}
               </div>

             {% when 'buy_buttons' %}
               <div class="buy-buttons" {{ block.shopify_attributes }}>
                 {% form 'product', product %}
                   <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
                   <div class="quantity-selector">
                     <label for="quantity">Quantity</label>
                     <input type="number" id="quantity" name="quantity" value="1" min="1">
                   </div>
                   <button
                     type="submit"
                     class="btn btn-primary add-to-cart"
                     {% unless product.selected_or_first_available_variant.available %}disabled{% endunless %}
                   >
                     {% if product.selected_or_first_available_variant.available %}
                       Add to cart — {{ product.selected_or_first_available_variant.price | money }}
                     {% else %}
                       Sold out
                     {% endif %}
                   </button>
                 {% endform %}
               </div>

             {% when 'description' %}
               <div class="product-description" {{ block.shopify_attributes }}>
                 {{ product.description }}
               </div>

             {% when 'custom_text' %}
               <div class="custom-text" {{ block.shopify_attributes }}>
                 {{ block.settings.text }}
               </div>
           {% endcase %}
         {% endfor %}
       </div>
     </div>
   </section>

   {% schema %}
   {
     "name": "Product Page",
     "tag": "section",
     "class": "section-product",
     "blocks": [
       {
         "type": "title",
         "name": "Title",
         "limit": 1
       },
       {
         "type": "price",
         "name": "Price",
         "limit": 1
       },
       {
         "type": "variant_picker",
         "name": "Variant Picker",
         "limit": 1
       },
       {
         "type": "buy_buttons",
         "name": "Buy Buttons",
         "limit": 1
       },
       {
         "type": "description",
         "name": "Description",
         "limit": 1
       },
       {
         "type": "custom_text",
         "name": "Custom Text",
         "settings": [
           {
             "type": "richtext",
             "id": "text",
             "label": "Text"
           }
         ]
       }
     ],
     "presets": [
       {
         "name": "Product Page",
         "blocks": [
           { "type": "title" },
           { "type": "price" },
           { "type": "variant_picker" },
           { "type": "buy_buttons" },
           { "type": "description" }
         ]
       }
     ]
   }
   {% endschema %}
   ```

4. **Implement AJAX cart with the Cart API**

   ```javascript
   // assets/cart.js
   class CartManager {
     async addItem(variantId, quantity = 1) {
       const response = await fetch('/cart/add.js', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           items: [{ id: variantId, quantity }],
         }),
       });

       if (!response.ok) {
         const error = await response.json();
         throw new Error(error.description || 'Could not add to cart');
       }

       const data = await response.json();
       this.updateCartUI();
       return data;
     }

     async updateQuantity(lineKey, quantity) {
       const response = await fetch('/cart/change.js', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id: lineKey, quantity }),
       });

       const cart = await response.json();
       this.updateCartUI(cart);
       return cart;
     }

     async getCart() {
       const response = await fetch('/cart.js');
       return response.json();
     }

     async updateCartUI(cart) {
       cart = cart || await this.getCart();

       // Update cart count badge
       const badge = document.querySelector('[data-cart-count]');
       if (badge) badge.textContent = cart.item_count;

       // Update cart drawer if open
       const drawer = document.querySelector('cart-drawer');
       if (drawer) drawer.render(cart);
     }
   }

   window.cart = new CartManager();
   ```

5. **Optimize for performance**

   ```liquid
   {% comment %}
     layout/theme.liquid — Critical performance optimizations
   {% endcomment %}
   <!doctype html>
   <html lang="{{ request.locale.iso_code }}">
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">

     <!-- Preconnect to Shopify CDN -->
     <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
     <link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>

     <!-- Preload critical assets -->
     {% if template.name == 'product' %}
       {% assign hero_image = product.featured_image %}
       {% if hero_image %}
         <link
           rel="preload"
           as="image"
           href="{{ hero_image | image_url: width: 800 }}"
           imagesrcset="{{ hero_image | image_url: width: 400 }} 400w,
                        {{ hero_image | image_url: width: 800 }} 800w"
           imagesizes="(min-width: 768px) 50vw, 100vw"
         >
       {% endif %}
     {% endif %}

     <!-- Inline critical CSS -->
     <style>
       {{ 'critical.css' | asset_url | stylesheet_tag | split: '<link' | first }}
     </style>

     <!-- Defer non-critical CSS -->
     <link rel="stylesheet" href="{{ 'theme.css' | asset_url }}" media="print" onload="this.media='all'">
     <noscript><link rel="stylesheet" href="{{ 'theme.css' | asset_url }}"></noscript>

     {{ content_for_header }}
   </head>
   <body>
     {{ content_for_layout }}

     <!-- Defer JavaScript -->
     <script src="{{ 'theme.js' | asset_url }}" defer></script>
   </body>
   </html>
   ```

6. **Create a theme app extension**

   ```bash
   # Generate a theme app extension block
   shopify app generate extension --type theme_app_extension --name my-app-block
   ```

   ```liquid
   {% comment %}
     extensions/my-app-block/blocks/product-badge.liquid
   {% endcomment %}
   <div class="app-product-badge" {{ block.shopify_attributes }}>
     {% if block.settings.badge_text != blank %}
       <span
         class="badge"
         style="background-color: {{ block.settings.badge_color }};
                color: {{ block.settings.text_color }};"
       >
         {{ block.settings.badge_text }}
       </span>
     {% endif %}
   </div>

   {% schema %}
   {
     "name": "Product Badge",
     "target": "section",
     "settings": [
       {
         "type": "text",
         "id": "badge_text",
         "label": "Badge text",
         "default": "New"
       },
       {
         "type": "color",
         "id": "badge_color",
         "label": "Badge color",
         "default": "#FF0000"
       },
       {
         "type": "color",
         "id": "text_color",
         "label": "Text color",
         "default": "#FFFFFF"
       }
     ]
   }
   {% endschema %}
   ```

## Examples

### Collection grid with lazy-loaded images

```liquid
{% comment %} sections/collection-grid.liquid {% endcomment %}
<section class="collection-grid">
  <h1>{{ collection.title }}</h1>

  <div class="product-grid" role="list">
    {% paginate collection.products by 24 %}
      {% for product in collection.products %}
        <div class="product-card" role="listitem">
          <a href="{{ product.url }}">
            {% if product.featured_image %}
              {{ product.featured_image | image_url: width: 400 | image_tag:
                loading: 'lazy',
                widths: '200,300,400',
                sizes: '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
                class: 'product-card-image'
              }}
            {% endif %}
            <h2 class="product-card-title">{{ product.title }}</h2>
            <p class="product-card-price">{{ product.price | money }}</p>
          </a>
        </div>
      {% endfor %}

      {% if paginate.pages > 1 %}
        <nav class="pagination" aria-label="Pagination">
          {{ paginate | default_pagination: next: 'Next', previous: 'Previous' }}
        </nav>
      {% endif %}
    {% endpaginate %}
  </div>
</section>
```

### Variant change with JavaScript

```javascript
// assets/variant-selector.js
class VariantSelector extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', this.onVariantChange.bind(this));
    this.productData = JSON.parse(
      this.querySelector('[type="application/json"]').textContent
    );
  }

  onVariantChange() {
    const selectedOptions = [...this.querySelectorAll('input:checked')].map(
      input => input.value
    );

    const variant = this.productData.variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    );

    if (!variant) return;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);

    // Update price display
    const priceEl = document.querySelector('.price-current');
    if (priceEl) {
      priceEl.textContent = this.formatMoney(variant.price);
    }

    // Update add-to-cart button
    const addToCart = document.querySelector('.add-to-cart');
    const idInput = document.querySelector('input[name="id"]');
    if (addToCart && idInput) {
      idInput.value = variant.id;
      addToCart.disabled = !variant.available;
      addToCart.textContent = variant.available ? 'Add to cart' : 'Sold out';
    }
  }

  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
}

customElements.define('variant-selector', VariantSelector);
```

## Best Practices

- **Use Online Store 2.0 JSON templates** — they enable merchants to add, remove, and reorder sections without editing code
- **Leverage the `image_url` and `image_tag` filters** — they generate responsive `srcset` attributes automatically from Shopify's CDN
- **Always include `{{ block.shopify_attributes }}`** — this data attribute is required for the theme editor to identify and select blocks
- **Defer all JavaScript** — use `defer` or `type="module"` on script tags; avoid render-blocking JS
- **Use Shopify's native Liquid filters** — `| money`, `| image_url`, `| asset_url` are optimized and handle edge cases; don't reinvent them
- **Provide section presets** — presets define the default state when a merchant adds a section; without them, the section won't appear in "Add section"
- **Keep sections under 50KB of Liquid** — large sections slow down the Liquid renderer; extract reusable code into snippets
- **Test on Shopify's staging theme** — always preview changes on an unpublished theme before deploying to the live theme

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Section not appearing in "Add section" menu | Ensure the section has a `presets` array in its `{% schema %}`; sections without presets are only available in JSON templates |
| Theme editor shows "Error rendering section" | Check for Liquid syntax errors; use `shopify theme check` to lint your Liquid code |
| Images not loading on Shopify CDN | Use `image_url` filter with explicit `width` parameter; the old `img_url` filter is deprecated |
| Cart count badge not updating after AJAX add | Fetch `/cart.js` after every cart mutation and update the badge; don't rely on the response from `add.js` alone |
| Slow Largest Contentful Paint (LCP) | Preload the hero/product image in `<head>` using `<link rel="preload" as="image">`; inline critical CSS |
| Metafields not accessible in Liquid | Ensure metafield definitions are created in Shopify admin; access via `product.metafields.namespace.key` |

## Related Skills

- @product-page-design
- @ecommerce-seo
- @ecommerce-caching
- @storefront-performance
- @shopify-app-development
