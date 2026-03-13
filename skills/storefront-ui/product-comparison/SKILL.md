---
name: product-comparison
description: "Let shoppers select multiple products and compare them side-by-side in a table with highlighted differences to help them make the right buying decision"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [comparison, product-table, attributes, side-by-side, specification, ux]
triggers: ["compare products", "product comparison table", "side by side comparison", "feature comparison", "spec comparison"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Comparison

## Overview

Build a side-by-side product comparison feature where shoppers select 2–4 products and see their attributes in a sticky-header table. Attribute rows that are identical across all selected products can be hidden to reduce noise. The comparison state is stored in the URL so it can be shared or bookmarked.

## When to Use This Skill

- When selling products with many technical specifications (electronics, appliances, cameras)
- When conversion research shows shoppers are considering multiple products before purchasing
- When the product catalog has well-structured attribute data that lends itself to comparison
- When building a B2B store where buyers need to justify purchase decisions to stakeholders
- When implementing a "Compare" checkbox on product listing pages

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Install **Comparify** or **Product Compare** app (both free tiers available) | Shopify doesn't have built-in comparison; these apps add Compare buttons to product cards, a floating comparison tray, and a full comparison table page; they pull product metafields for spec data |
| **WooCommerce** | Install **YITH WooCommerce Compare** (free) or **WooCommerce Products Compare** | YITH Compare is the most popular free option — adds Compare checkboxes to product cards, a comparison table page using WooCommerce product attributes, and a "show differences only" toggle |
| **BigCommerce** | Enable the built-in **Compare** feature in **Storefront → My Themes → Customize** (Cornerstone theme) | BigCommerce and Cornerstone include native product comparison — enable it in the Theme Editor; it uses product custom fields as comparison attributes |
| **Custom / Headless** | Build a URL-state comparison tray + comparison table page with your product attribute data | Full control over attribute display, difference highlighting, and table layout; see implementation below |

### Step 2: Enable and configure comparison on your platform

---

#### Shopify

**Using Comparify app:**
1. Install **Comparify – Product Comparison** from the Shopify App Store (free tier available)
2. In the app settings, select which product metafields to display as comparison rows (e.g., material, weight, dimensions, warranty)
   - If you haven't set up metafields yet: go to **Settings → Custom data → Products** and create metafields for your specs
3. The app automatically adds a "Compare" checkbox to product cards in your collection pages
4. Shoppers select up to 4 products, click "Compare" in the floating tray, and land on a full comparison table
5. Configure which attributes appear as rows and in what order in the app's **Table Settings**

**Preparing your product data:**
- Add spec data as **product metafields** (recommended) or in the product description with consistent formatting
- For variant specs, add them as variant metafields (e.g., weight per size)

---

#### WooCommerce

**Using YITH WooCommerce Compare (free):**
1. Install and activate from WordPress.org
2. Go to **YITH → Compare → Settings**
3. Under **Fields to compare**, select which WooCommerce product attributes and custom fields to show as rows (e.g., Color, Material, Dimensions, Weight)
4. Set **Maximum products** to 4
5. Enable **Highlight differences** to visually call out rows where products differ
6. The plugin adds a "Compare" button to product cards on your shop page and archives
7. A floating comparison bar appears at the bottom of the page as shoppers add products

**Preparing your product data:**
- Add comparison attributes via **Products → Attributes** — create attributes like "Material", "Warranty", "Compatible with" and assign values to each product
- Products must use the same attribute names for comparison rows to align correctly

---

#### BigCommerce

**Built-in comparison (Cornerstone theme):**
1. Go to **Storefront → My Themes → Customize**
2. Navigate to **Global → Product Compare** (or **Category Page → Product Compare** depending on your theme version)
3. Toggle **Enable product comparison** to On
4. Set the **Maximum products** (default is 4)
5. Configure which **Product Custom Fields** appear as comparison rows in **Products → Product Custom Fields** settings
6. Shoppers see a "Compare" checkbox on product cards; the floating compare tray appears automatically

**Adding spec data:**
- Go to **Products → [product] → Custom Fields** and add name/value pairs (e.g., "Screen Size: 15.6 inches", "Battery Life: 10 hours")
- Use the same field names across comparable products so they align in the comparison table

---

#### Custom / Headless

**Comparison tray (floating bar as products are selected):**
```jsx
// ComparisonTray.jsx
export function ComparisonTray({ selectedProducts, onRemove, onClear }) {
  if (selectedProducts.length === 0) return null;

  const compareUrl = `/compare?${selectedProducts.map(p => `compare=${p.id}`).join('&')}`;

  return (
    <div className="comparison-tray" aria-live="polite" aria-label="Products selected for comparison">
      <div className="tray-products">
        {selectedProducts.map(product => (
          <div key={product.id} className="tray-product">
            <img src={product.image} alt={product.name} width="48" height="48" />
            <button onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from comparison`}>&times;</button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - selectedProducts.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="tray-placeholder" aria-hidden="true">+</div>
        ))}
      </div>
      <div className="tray-actions">
        <a href={compareUrl} className="btn-primary" aria-disabled={selectedProducts.length < 2}>
          Compare ({selectedProducts.length})
        </a>
        <button onClick={onClear}>Clear all</button>
      </div>
    </div>
  );
}
```

**Comparison table with sticky headers and difference highlighting:**
```jsx
export function ProductComparisonTable({ products, attributeGroups, showOnlyDifferences }) {
  function isRowIdentical(attrKey) {
    const values = products.map(p => p.attributes[attrKey]);
    return values.every(v => v === values[0]);
  }

  return (
    <div className="comparison-wrapper" style={{ overflowX: 'auto' }}>
      <table className="comparison-table">
        <caption className="sr-only">
          Side-by-side comparison of {products.map(p => p.name).join(', ')}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="attr-col">Attribute</th>
            {products.map(product => (
              <th key={product.id} scope="col">
                <img src={product.image} alt={product.name} width="80" height="80" />
                <a href={product.url}>{product.name}</a>
                <strong>${product.price}</strong>
                <button className="btn-primary">Add to Cart</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributeGroups.map(group => (
            <>
              <tr key={`group-${group.label}`}>
                <th scope="rowgroup" colSpan={products.length + 1}>{group.label}</th>
              </tr>
              {group.attributes.map(attrKey => {
                if (showOnlyDifferences && isRowIdentical(attrKey)) return null;
                return (
                  <tr key={attrKey} className={isRowIdentical(attrKey) ? 'identical-row' : 'different-row'}>
                    <th scope="row">{attrKey.replace(/_/g, ' ')}</th>
                    {products.map(p => (
                      <td key={p.id}>{p.attributes[attrKey] ?? 'N/A'}</td>
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
```

**URL state for comparison (use `replaceState` to avoid polluting back-button history):**
```javascript
function toggleCompare(productId) {
  const params = new URLSearchParams(window.location.search);
  const current = params.getAll('compare');
  if (current.includes(productId)) {
    params.delete('compare');
    current.filter(id => id !== productId).forEach(id => params.append('compare', id));
  } else if (current.length < 4) {
    params.append('compare', productId);
  }
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}
```

## Best Practices

- **Limit comparison to 2–4 products** — more than 4 columns breaks table layout on most screens; enforce this in the UI
- **Group attributes by category** — organize specs into groups (Display, Performance, Battery) to prevent a 50-row flat table
- **Offer "show differences only" toggle** — rows where all products share the same value add noise; provide an easy toggle
- **Make the table horizontally scrollable on mobile** — use `overflow-x: auto` on a wrapper; never hide columns to fit small screens
- **Pre-populate from listing page** — when a shopper clicks "Compare Now" after selecting items on the PLP, navigate with IDs in the URL
- **Use consistent attribute naming** — specs across products must use identical field names (e.g., "Screen Size" not sometimes "Display Size") for table rows to align

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Table overflows on mobile | Wrap in a scrollable container; use `position: sticky` for the first column (attribute labels) |
| Attributes missing for some products | Use "N/A" as the value — never skip the cell as it breaks column alignment |
| Comparison tray covers page content | Add `padding-bottom` to the page body equal to the tray height when the tray is visible |
| Products have different attribute sets | Normalize attribute keys across all compared products; fill missing values with `null` |

## Related Skills

- @product-page-design
- @faceted-navigation
- @accessibility-commerce
- @recently-viewed-products
