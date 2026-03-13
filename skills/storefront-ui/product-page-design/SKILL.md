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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Page Design

## Overview

Build high-converting product detail pages (PDP) with zoomable image galleries, variant selectors (size, color, material), quantity controls, and social proof elements. This skill covers responsive layout patterns, accessibility requirements, and the component architecture that drives conversion — from above-the-fold hero sections to sticky add-to-cart bars on mobile.

## When to Use This Skill

- When building a product detail page from scratch for a new storefront
- When optimizing an existing PDP for higher add-to-cart conversion rates
- When implementing a variant selector that handles multiple option types (size + color)
- When adding an image gallery with zoom, thumbnails, and swipe support
- When integrating social proof elements like reviews, ratings, and stock indicators

## Core Instructions

1. **Structure the PDP layout with a two-column grid**

   The standard high-converting layout places the gallery on the left and product info on the right (stacking vertically on mobile):

   ```html
   <div class="pdp-container">
     <div class="pdp-grid">
       <section class="pdp-gallery" aria-label="Product images">
         <!-- Image gallery component -->
       </section>
       <section class="pdp-info">
         <nav aria-label="Breadcrumb" class="pdp-breadcrumb">
           <ol>
             <li><a href="/">Home</a></li>
             <li><a href="/collections/shoes">Shoes</a></li>
             <li aria-current="page">Air Max 90</li>
           </ol>
         </nav>
         <h1 class="pdp-title">Air Max 90</h1>
         <div class="pdp-price" aria-label="Price">$129.99</div>
         <div class="pdp-rating" aria-label="4.5 out of 5 stars, 238 reviews">
           <!-- Star rating component -->
         </div>
         <!-- Variant selectors, quantity, add-to-cart -->
       </section>
     </div>
   </div>
   ```

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
     .pdp-grid {
       grid-template-columns: 1fr;
     }
   }
   ```

2. **Build an image gallery with thumbnails and zoom**

   ```tsx
   import { useState, useRef } from 'react';

   interface ProductImage {
     src: string;
     alt: string;
     width: number;
     height: number;
   }

   function ProductGallery({ images }: { images: ProductImage[] }) {
     const [activeIndex, setActiveIndex] = useState(0);
     const [isZoomed, setIsZoomed] = useState(false);
     const imageRef = useRef<HTMLDivElement>(null);

     const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
       if (!isZoomed || !imageRef.current) return;
       const { left, top, width, height } = imageRef.current.getBoundingClientRect();
       const x = ((e.clientX - left) / width) * 100;
       const y = ((e.clientY - top) / height) * 100;
       imageRef.current.style.backgroundPosition = `${x}% ${y}%`;
     };

     return (
       <div className="gallery">
         <div
           ref={imageRef}
           className={`gallery-main ${isZoomed ? 'zoomed' : ''}`}
           onClick={() => setIsZoomed(!isZoomed)}
           onMouseMove={handleMouseMove}
           style={{
             backgroundImage: isZoomed ? `url(${images[activeIndex].src})` : 'none',
             backgroundSize: '200%',
           }}
           role="img"
           aria-label={images[activeIndex].alt}
         >
           {!isZoomed && (
             <img
               src={images[activeIndex].src}
               alt={images[activeIndex].alt}
               width={images[activeIndex].width}
               height={images[activeIndex].height}
               loading={activeIndex === 0 ? 'eager' : 'lazy'}
             />
           )}
         </div>
         <div className="gallery-thumbnails" role="listbox" aria-label="Product image thumbnails">
           {images.map((img, i) => (
             <button
               key={i}
               className={`thumbnail ${i === activeIndex ? 'active' : ''}`}
               onClick={() => setActiveIndex(i)}
               aria-selected={i === activeIndex}
               aria-label={`View ${img.alt}`}
             >
               <img src={img.src} alt="" width={80} height={80} loading="lazy" />
             </button>
           ))}
         </div>
       </div>
     );
   }
   ```

3. **Implement variant selection with availability tracking**

   ```tsx
   interface Variant {
     id: string;
     options: Record<string, string>; // e.g., { color: 'Red', size: 'M' }
     price: number;
     compareAtPrice?: number;
     inventory: number;
     image?: string;
   }

   function VariantSelector({
     variants,
     selectedOptions,
     onOptionChange,
   }: {
     variants: Variant[];
     selectedOptions: Record<string, string>;
     onOptionChange: (option: string, value: string) => void;
   }) {
     // Extract unique option names and values
     const optionNames = [...new Set(variants.flatMap(v => Object.keys(v.options)))];

     const getAvailableValues = (optionName: string): Map<string, boolean> => {
       const values = new Map<string, boolean>();
       for (const variant of variants) {
         const value = variant.options[optionName];
         // Check if this value is available given other selected options
         const isAvailable = variants.some(v => {
           if (v.options[optionName] !== value) return false;
           if (v.inventory <= 0) return false;
           return Object.entries(selectedOptions).every(
             ([k, sv]) => k === optionName || v.options[k] === sv
           );
         });
         values.set(value, isAvailable);
       }
       return values;
     };

     return (
       <div className="variant-selector">
         {optionNames.map(optionName => (
           <fieldset key={optionName} className="option-group">
             <legend>{optionName}: <strong>{selectedOptions[optionName]}</strong></legend>
             <div className="option-values" role="radiogroup">
               {[...getAvailableValues(optionName)].map(([value, available]) => (
                 <button
                   key={value}
                   className={`option-btn ${selectedOptions[optionName] === value ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                   onClick={() => available && onOptionChange(optionName, value)}
                   disabled={!available}
                   role="radio"
                   aria-checked={selectedOptions[optionName] === value}
                   aria-label={`${optionName}: ${value}${!available ? ' (unavailable)' : ''}`}
                 >
                   {value}
                 </button>
               ))}
             </div>
           </fieldset>
         ))}
       </div>
     );
   }
   ```

4. **Add a sticky add-to-cart bar for mobile**

   ```tsx
   function StickyAddToCart({ product, selectedVariant, onAddToCart }) {
     const [isVisible, setIsVisible] = useState(false);

     useEffect(() => {
       const observer = new IntersectionObserver(
         ([entry]) => setIsVisible(!entry.isIntersecting),
         { threshold: 0 }
       );
       const mainButton = document.getElementById('main-add-to-cart');
       if (mainButton) observer.observe(mainButton);
       return () => observer.disconnect();
     }, []);

     if (!isVisible) return null;

     return (
       <div className="sticky-atc" role="complementary" aria-label="Add to cart">
         <div className="sticky-atc-info">
           <span className="sticky-atc-title">{product.title}</span>
           <span className="sticky-atc-price">
             {formatCurrency(selectedVariant.price)}
           </span>
         </div>
         <button
           className="sticky-atc-button"
           onClick={onAddToCart}
           disabled={selectedVariant.inventory <= 0}
         >
           {selectedVariant.inventory <= 0 ? 'Sold Out' : 'Add to Cart'}
         </button>
       </div>
     );
   }
   ```

5. **Integrate social proof elements**

   ```tsx
   function SocialProof({ productId }: { productId: string }) {
     const { reviews, averageRating, totalCount } = useReviews(productId);

     return (
       <section className="social-proof" aria-label="Customer reviews">
         <div className="rating-summary">
           <StarRating rating={averageRating} />
           <span>{averageRating.toFixed(1)} out of 5</span>
           <a href="#reviews">{totalCount} reviews</a>
         </div>

         {/* Urgency indicator — only show if real data backs it */}
         <StockIndicator productId={productId} />

         {/* Recent purchase notification */}
         <RecentPurchase productId={productId} />
       </section>
     );
   }

   function StockIndicator({ productId }: { productId: string }) {
     const { inventory } = useInventory(productId);

     if (inventory > 10) return null;
     if (inventory <= 0) return <p className="stock-out">Out of stock</p>;

     return (
       <p className="stock-low" role="status">
         Only {inventory} left in stock — order soon
       </p>
     );
   }
   ```

6. **Add structured data for SEO**

   Use Next.js `<Head>` or a library like `next-seo` to inject JSON-LD structured data safely:

   ```typescript
   // Use next-seo's ProductJsonLd or manually build the script tag server-side
   import { ProductJsonLd } from 'next-seo';

   function ProductSeo({ product, reviews }) {
     return (
       <ProductJsonLd
         productName={product.title}
         images={product.images.map(i => i.src)}
         description={product.description}
         sku={product.sku}
         brand={product.brand}
         offers={[{
           price: (product.variants[0].price / 100).toFixed(2),
           priceCurrency: 'USD',
           availability: product.inStock
             ? 'https://schema.org/InStock'
             : 'https://schema.org/OutOfStock',
         }]}
         aggregateRating={reviews.totalCount > 0 ? {
           ratingValue: String(reviews.averageRating),
           reviewCount: String(reviews.totalCount),
         } : undefined}
       />
     );
   }

   // Or build the JSON-LD object for server-side rendering:
   function buildProductSchema(product, reviews) {
     return {
       '@context': 'https://schema.org',
       '@type': 'Product',
       name: product.title,
       image: product.images.map(i => i.src),
       description: product.description,
       sku: product.sku,
       brand: { '@type': 'Brand', name: product.brand },
       offers: {
         '@type': 'AggregateOffer',
         lowPrice: (Math.min(...product.variants.map(v => v.price)) / 100).toFixed(2),
         highPrice: (Math.max(...product.variants.map(v => v.price)) / 100).toFixed(2),
         priceCurrency: 'USD',
         availability: product.inStock
           ? 'https://schema.org/InStock'
           : 'https://schema.org/OutOfStock',
       },
     };
   }
   ```

## Examples

### Complete PDP page component

```tsx
export default function ProductPage({ product }: { product: Product }) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    getDefaultOptions(product.variants)
  );

  const selectedVariant = product.variants.find(v =>
    Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)
  );

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
    });
  };

  return (
    <>
      <ProductSeo product={product} reviews={product.reviews} />
      <div className="pdp-grid">
        <ProductGallery
          images={product.images}
          activeVariantImage={selectedVariant?.image}
        />
        <div className="pdp-info">
          <Breadcrumb items={product.breadcrumbs} />
          <h1>{product.title}</h1>
          <PriceDisplay
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <SocialProof productId={product.id} />
          <VariantSelector
            variants={product.variants}
            selectedOptions={selectedOptions}
            onOptionChange={(opt, val) =>
              setSelectedOptions(prev => ({ ...prev, [opt]: val }))
            }
          />
          <button
            id="main-add-to-cart"
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.inventory <= 0}
          >
            {!selectedVariant
              ? 'Select Options'
              : selectedVariant.inventory <= 0
                ? 'Sold Out'
                : 'Add to Cart'}
          </button>
          <ProductDescription description={product.description} />
        </div>
      </div>
      <StickyAddToCart
        product={product}
        selectedVariant={selectedVariant}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
```

### Responsive image gallery CSS

```css
.gallery {
  position: sticky;
  top: 2rem;
}

.gallery-main {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: zoom-in;
}

.gallery-main.zoomed {
  cursor: zoom-out;
}

.gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.thumbnail.active {
  border-color: var(--color-primary);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 2px;
}

.sticky-atc {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-top: 1px solid #e5e5e5;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

@media (min-width: 769px) {
  .sticky-atc {
    display: none;
  }
}
```

## Best Practices

- **Prioritize above-the-fold content** — title, price, main image, and add-to-cart button should be visible without scrolling on desktop
- **Use semantic HTML and ARIA labels** — screen readers must be able to navigate variant selectors and image galleries
- **Lazy-load below-the-fold images** — only the hero image should use `loading="eager"`; all thumbnails and secondary images use `loading="lazy"`
- **Show compare-at prices clearly** — display the original price with a strikethrough next to the sale price for anchoring effect
- **Disable unavailable variant combinations** — don't hide out-of-stock options; show them as disabled so users understand what exists
- **Use real inventory data for urgency** — never fake "only 3 left" messaging; use actual stock counts or remove the indicator entirely
- **Preload the hero image** — add `<link rel="preload" as="image">` for the first product image to improve LCP
- **Support keyboard navigation** — variant selectors should work with arrow keys, gallery with left/right arrows

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CLS (Cumulative Layout Shift) from image loading | Always set explicit `width` and `height` on images, or use `aspect-ratio` on the container |
| Variant selector doesn't update the URL | Use `replaceState` to update the URL with the selected variant ID so the page is shareable |
| Zoom doesn't work on touch devices | Implement pinch-to-zoom for mobile instead of hover-based zoom (use `touch-action: none` on the container) |
| Add-to-cart button hidden on long pages (mobile) | Implement a sticky add-to-cart bar that appears when the main button scrolls out of view |
| Gallery images are too large (slow load) | Serve responsive images with `srcset` and use WebP/AVIF formats with a fallback |
| Reviews section causes long initial load | Lazy-load the reviews section — load reviews only when the user scrolls near the section |

## Related Skills

- @ecommerce-seo
- @checkout-flow-optimization
- @product-data-modeling
- @storefront-performance
- @ab-testing-experimentation
