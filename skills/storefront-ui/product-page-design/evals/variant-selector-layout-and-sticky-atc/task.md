# Product Detail Page — Variants, Layout, and Add to Cart

## Problem/Feature Description

An outdoor apparel brand is launching a new storefront built with React and TypeScript. Their flagship jacket comes in 3 colors and 5 sizes, but not every color–size combination is in stock. The product team wants a product detail page that lets customers confidently browse and select a variant — they need to see which combinations exist (even when out of stock) so they can decide whether to wait for a restock or choose an alternative.

The page also needs a persistent way for mobile shoppers to add to cart without scrolling back to the top. Analytics shows that on mobile, 40% of add-to-cart clicks on competitor sites happen from persistent bottom bars, not from the main product section. The URL should also reflect the selected variant so customers can share specific configurations with friends.

When the jacket is on sale, the page must clearly communicate the saving — the original price should remain visible next to the discounted price.

## Output Specification

Produce the following files:
- `ProductPage.tsx` — the main product detail page component
- `VariantSelector.tsx` — the variant selection component
- `StickyAddToCart.tsx` — the sticky add-to-cart bar component
- `ProductPage.css` — layout and component styles

Use the following product data (inline it into your code or a separate `mockProduct.ts`):

```
Product: Summit Shell Jacket
Variants: combinations of Color (Midnight Blue, Forest Green, Burnt Orange) × Size (XS, S, M, L, XL)
In-stock combinations:
  Midnight Blue: S, M, L
  Forest Green: XS, S, L, XL
  Burnt Orange: M, XL
Price: $189.00, compare-at price: $249.00
```

Do not set up a bundler or dev server — just produce the component source files. Include a short `DECISIONS.md` noting any layout or behavior decisions.
