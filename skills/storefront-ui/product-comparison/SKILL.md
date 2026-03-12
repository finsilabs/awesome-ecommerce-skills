---
name: product-comparison
description: "Side-by-side feature comparison tables with dynamic attribute selection"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [comparison, product-table, attributes, side-by-side, specification, ux]
triggers: ["compare products", "product comparison table", "side by side comparison", "feature comparison", "spec comparison"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Comparison

## Overview

Build a side-by-side product comparison feature where shoppers select 2-4 products and see their attributes displayed in a sticky header table. Attribute rows that are identical across all selected products can be hidden to reduce noise. The comparison state is stored in the URL so it can be shared or bookmarked.

## When to Use This Skill

- When selling products with many technical specifications (electronics, appliances, cameras)
- When conversion research shows shoppers are considering multiple products before purchasing
- When the product catalog has well-structured attribute data that lends itself to comparison
- When building a B2B store where buyers need to justify purchase decisions to stakeholders
- When implementing a "Compare" checkbox on product listing pages

## Core Instructions

1. **Add "Compare" checkboxes to product listing cards**

   ```jsx
   // ProductCard.jsx
   export function ProductCard({ product, comparedIds, onToggleCompare }) {
     const isComparing = comparedIds.includes(product.id);
     const atLimit = comparedIds.length >= 4;

     return (
       <article className="product-card">
         {/* Product content */}
         <div className="product-card__compare">
           <label htmlFor={`compare-${product.id}`}>
             <input
               id={`compare-${product.id}`}
               type="checkbox"
               checked={isComparing}
               disabled={!isComparing && atLimit}
               onChange={() => onToggleCompare(product.id)}
             />
             Compare
           </label>
         </div>
       </article>
     );
   }
   ```

2. **Sync comparison state to the URL**

   ```javascript
   // hooks/useProductComparison.js
   import { useCallback } from 'react';

   export function useProductComparison() {
     function getComparedIds() {
       const params = new URLSearchParams(window.location.search);
       return params.getAll('compare');
     }

     function setComparedIds(ids) {
       const params = new URLSearchParams(window.location.search);
       params.delete('compare');
       ids.forEach(id => params.append('compare', id));
       const newUrl = `${window.location.pathname}?${params.toString()}`;
       window.history.replaceState({}, '', newUrl);
     }

     const toggle = useCallback((productId) => {
       const current = getComparedIds();
       if (current.includes(productId)) {
         setComparedIds(current.filter(id => id !== productId));
       } else if (current.length < 4) {
         setComparedIds([...current, productId]);
       }
     }, []);

     const clearAll = useCallback(() => {
       setComparedIds([]);
     }, []);

     return { comparedIds: getComparedIds(), toggle, clearAll };
   }
   ```

3. **Build the comparison table component**

   ```jsx
   // ProductComparisonTable.jsx

   export function ProductComparisonTable({ products, attributeGroups, showOnlyDifferences }) {
     // products: array of product objects with an `attributes` map
     // attributeGroups: [{ label: 'Display', attributes: ['screen_size', 'resolution', 'refresh_rate'] }]

     function isRowIdentical(attrKey) {
       const values = products.map(p => p.attributes[attrKey]);
       return values.every(v => v === values[0]);
     }

     return (
       <div className="comparison-wrapper" role="region" aria-label="Product comparison">
         <table className="comparison-table">
           <caption className="sr-only">
             Side-by-side comparison of {products.map(p => p.name).join(', ')}
           </caption>

           {/* Sticky product header row */}
           <thead>
             <tr>
               <th scope="col" className="attr-col">Attribute</th>
               {products.map(product => (
                 <th key={product.id} scope="col" className="product-col">
                   <div className="comparison-product-header">
                     <img src={product.image} alt={product.name} width="80" height="80" />
                     <a href={product.url}>{product.name}</a>
                     <strong>${product.price}</strong>
                     <button className="btn-primary" onClick={() => addToCart(product)}>
                       Add to Cart
                     </button>
                   </div>
                 </th>
               ))}
             </tr>
           </thead>

           {/* Attribute rows grouped by category */}
           <tbody>
             {attributeGroups.map(group => (
               <>
                 <tr key={`group-${group.label}`} className="group-row">
                   <th scope="rowgroup" colSpan={products.length + 1}>{group.label}</th>
                 </tr>
                 {group.attributes.map(attrKey => {
                   const identical = isRowIdentical(attrKey);
                   if (showOnlyDifferences && identical) return null;

                   return (
                     <tr key={attrKey} className={identical ? 'identical-row' : 'different-row'}>
                       <th scope="row" className="attr-label">
                         {attrKey.replace(/_/g, ' ')}
                       </th>
                       {products.map(product => (
                         <td key={product.id} className="attr-value">
                           <AttributeValue value={product.attributes[attrKey]} />
                         </td>
                       ))}
                     </tr>
                   );
                 })}
               </>
             ))}
           </tbody>
         </table>
       </div>
     );
   }

   function AttributeValue({ value }) {
     if (value === true || value === 'Yes') return <span className="check" aria-label="Yes">&#x2713;</span>;
     if (value === false || value === 'No' || value === null) return <span className="cross" aria-label="No">&#x2715;</span>;
     return <span>{value}</span>;
   }
   ```

4. **Add a floating comparison tray**

   Show a fixed bar at the bottom of the screen when 1+ products are selected for comparison.

   ```jsx
   // ComparisonTray.jsx
   export function ComparisonTray({ selectedProducts, onRemove, onClear }) {
     if (selectedProducts.length === 0) return null;

     return (
       <div className="comparison-tray" aria-live="polite" aria-label="Products selected for comparison">
         <div className="tray-products">
           {selectedProducts.map(product => (
             <div key={product.id} className="tray-product">
               <img src={product.image} alt={product.name} width="48" height="48" />
               <button
                 onClick={() => onRemove(product.id)}
                 aria-label={`Remove ${product.name} from comparison`}
               >
                 &times;
               </button>
             </div>
           ))}
           {/* Placeholder slots */}
           {Array.from({ length: Math.max(0, 4 - selectedProducts.length) }).map((_, i) => (
             <div key={`empty-${i}`} className="tray-placeholder" aria-hidden="true">+</div>
           ))}
         </div>
         <div className="tray-actions">
           <span>{selectedProducts.length}/4 selected</span>
           <a
             href={`/compare?${selectedProducts.map(p => `compare=${p.id}`).join('&')}`}
             className="btn-primary"
             aria-disabled={selectedProducts.length < 2}
           >
             Compare
           </a>
           <button onClick={onClear} className="btn-secondary">Clear all</button>
         </div>
       </div>
     );
   }
   ```

5. **Fetch comparison data and define attribute schema**

   ```javascript
   // api/comparison.js
   export async function getComparisonData(productIds) {
     const products = await db.products.findMany({
       where: { id: { in: productIds } },
       include: { attributes: true, variants: { orderBy: { price: 'asc' } } },
     });

     // Normalize attribute keys across all products
     const allAttributeKeys = new Set(
       products.flatMap(p => p.attributes.map(a => a.key))
     );

     return products.map(product => ({
       id: product.id,
       name: product.name,
       price: product.variants[0]?.price ?? product.price,
       image: product.images[0],
       url: `/products/${product.slug}`,
       attributes: Object.fromEntries(
         [...allAttributeKeys].map(key => [
           key,
           product.attributes.find(a => a.key === key)?.value ?? null,
         ])
       ),
     }));
   }
   ```

## Examples

### Comparison table CSS with sticky first column

```css
.comparison-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.comparison-table {
  min-width: 600px;
  border-collapse: collapse;
  width: 100%;
}

.comparison-table th,
.comparison-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  min-width: 160px;
}

/* Sticky attribute label column */
.attr-col {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 2;
  min-width: 140px;
  max-width: 200px;
}

/* Sticky product header row */
thead tr {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #fff;
}

.identical-row td { color: #94a3b8; }
.different-row { background: #f8fafc; }
```

### Highlighting the winner in each row

```javascript
function getBestValue(attrKey, products, higherIsBetter = true) {
  const values = products.map(p => parseFloat(p.attributes[attrKey])).filter(v => !isNaN(v));
  if (values.length === 0) return null;
  return higherIsBetter ? Math.max(...values) : Math.min(...values);
}

// In the table cell
const numericValue = parseFloat(product.attributes[attrKey]);
const isWinner = numericValue === getBestValue(attrKey, products, attr.higherIsBetter);
```

## Best Practices

- **Limit comparison to 2-4 products** — more than 4 columns breaks table layout on most screens; enforce this in the UI
- **Group attributes by category** — flatten specs into categories (Display, Performance, Battery) to prevent a 50-row table
- **Offer "show differences only" toggle** — rows where all products share the same value add noise; default to showing all, with an easy filter
- **Make the table horizontally scrollable on mobile** — use `overflow-x: auto` on a wrapper; never sacrifice content to fit small screens
- **Highlight the best value in each row** — for numeric attributes (screen size, battery life), bold or color the highest (or lowest) value
- **Persist comparison state in URL** — `/compare?compare=id1&compare=id2` allows sharing and bookmarking
- **Pre-populate from listing page** — when a shopper clicks "Compare" after selecting items on the PLP, navigate to the comparison page with IDs already in the URL

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Table overflows on mobile | Wrap in a scrollable container; use `position: sticky` for the first column (attribute labels) not `position: fixed` |
| Attributes missing for some products | Use `null` as the value and render "N/A"; do not skip the cell as it breaks column alignment |
| Comparison tray covers page content | Add `padding-bottom` to the page body equal to the tray height when the tray is visible |
| URL state lost when navigating back | Use `history.replaceState` (not pushState) for toggling comparison checkboxes so it does not pollute back-button history |

## Related Skills

- @product-page-design
- @faceted-navigation
- @accessibility-commerce
- @recently-viewed-products
