---
name: search-autocomplete
description: "Speed up product discovery with instant search suggestions, fuzzy typo matching, and category-aware results powered by Algolia or Elasticsearch"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [search, autocomplete, typeahead, fuzzy-matching, merchandising, algolia, elasticsearch]
triggers: ["add search autocomplete", "implement typeahead search", "product search suggestions", "search as you type", "fuzzy search"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Search Autocomplete

## Overview

Implement a typeahead search experience that surfaces product suggestions, categories, and content as shoppers type. Combines client-side debouncing with server-side fuzzy matching, applies merchandising rules (boosts, pins, synonyms), and renders a structured dropdown that drives measurable conversion lift.

## When to Use This Skill

- When shoppers are failing to find products through browse navigation alone
- When site search click-through rates are below 30% of searches
- When adding a search-as-you-type experience to an existing search endpoint
- When integrating a third-party search service (Algolia, Elasticsearch, Typesense)
- When implementing merchandising rules to boost promoted products in results
- When supporting multi-language storefronts requiring synonym and phonetic matching

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Install **Search & Discovery** app (free, by Shopify) for synonym/boost configuration + **Searchie** or **Boost Commerce** app for full autocomplete dropdown | Search & Discovery improves the built-in Shopify search with synonyms and product boosts; Boost Commerce ($19/mo) adds a fully styled autocomplete dropdown with category results and merchandising rules |
| **WooCommerce** | Install **FiboSearch – AJAX Search for WooCommerce** (free/paid) or **SearchWP** + SearchWP Live Search extension | FiboSearch adds an instant AJAX autocomplete dropdown to the WooCommerce search bar with product images, prices, and category results — no custom code needed |
| **BigCommerce** | Enable **Search Suggestions** in **Storefront → Search** settings + install **Klevu Smart Search** or **Searchspring** for advanced autocomplete | BigCommerce's native search has basic autocomplete; Klevu ($449+/mo) and Searchspring add AI-powered autocomplete, synonym management, and merchandising rules |
| **Custom / Headless** | Build with Algolia InstantSearch.js (recommended) or self-hosted Typesense; implement debounced input, AbortController for race conditions, and ARIA combobox pattern | Algolia offers the best developer experience with a generous free tier (10K searches/month); Typesense is the self-hosted alternative |

### Step 2: Configure search autocomplete on your platform

---

#### Shopify

**Search & Discovery app (required baseline — free):**
1. Install **Search & Discovery** from the Shopify App Store
2. Go to **Apps → Search & Discovery → Synonyms** and add business synonyms:
   - Bidirectional: "sneakers" ↔ "trainers" ↔ "shoes"
   - One-way: "tv" → "television", "flat screen"
3. Under **Boosts**, pin high-priority products or collections to appear first for specific queries
4. Under **Filter settings**, configure which attributes appear as filters alongside search results
5. The app improves Shopify's native predictive search API used by all OS2.0 theme search bars

**Boost Commerce app (full autocomplete dropdown):**
1. Install **Boost Commerce – Product Filter & Search** from the Shopify App Store
2. In the app dashboard, configure the **Instant Search** popup:
   - Enable product image + price in suggestions
   - Add category/collection suggestions
   - Configure the number of product results (recommend 5–8)
3. Set up **Merchandising rules** in the app: boost new arrivals, pin best sellers, exclude out-of-stock from suggestions
4. Customize the popup's appearance to match your theme colors in the **Design** settings

---

#### WooCommerce

**FiboSearch (recommended — free tier available):**
1. Install **FiboSearch – AJAX Search for WooCommerce** from WordPress.org
2. Go to **FiboSearch → Settings → General**
3. Configure what appears in suggestions:
   - **Products**: name, SKU, tags (enable all for best results)
   - **Categories**: enable to show category suggestions
   - **Pages/Posts**: enable if you have blog content
4. Set **Fuzzy Search** to On — this handles typos like "adids" → "Adidas"
5. Under **Appearance**, configure the dropdown layout: product image + name + price vs. compact text-only
6. FiboSearch replaces the default WooCommerce search widget — it works with the standard search input, Elementor search widgets, and most theme search bars

**SearchWP + Live Search extension:**
1. Install **SearchWP** (paid, from $99/yr) for advanced indexing control
2. Install the **SearchWP Live Search** extension for real-time autocomplete
3. In the SearchWP admin, configure which product fields are indexed with what weight (name > SKU > description)
4. Enable custom fields and product attributes in the index for spec-based searching

---

#### BigCommerce

1. Go to **Storefront → Search** in your BigCommerce control panel
2. Under **Search Suggestions**, enable **Products**, **Categories**, and **Brands** as suggestion types
3. Set the number of suggestions to show (5–8 for products)
4. Configure **Search as you type** to start after 2 characters

**Klevu Smart Search (advanced autocomplete):**
1. Install from the BigCommerce App Marketplace
2. In the Klevu dashboard, configure synonym groups and boosting rules
3. Klevu's autocomplete dropdown automatically shows product images, prices, categories, and trending searches
4. Add custom banners to the search dropdown for specific queries (e.g., show a "Summer Sale" banner when someone searches "dress")

---

#### Custom / Headless

**Debounced input hook with AbortController (prevents race conditions):**
```javascript
// useSearchAutocomplete.js
import { useState, useEffect, useRef, useCallback } from 'react';

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function useSearchAutocomplete(minChars = 2) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], categories: [], suggestions: [] });
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const fetchSuggestions = useCallback(
    debounce(async (q) => {
      if (q.length < minChars) { setResults({ products: [], categories: [], suggestions: [] }); return; }
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}&limit=5`,
          { signal: abortRef.current.signal });
        setResults(await res.json());
      } catch (err) { if (err.name !== 'AbortError') console.error(err); }
      finally { setLoading(false); }
    }, 250),
    [minChars]
  );

  useEffect(() => { fetchSuggestions(query); }, [query, fetchSuggestions]);
  return { query, setQuery, results, loading };
}
```

**Accessible combobox dropdown (ARIA combobox + listbox pattern):**
```jsx
// SearchAutocomplete.jsx
import DOMPurify from 'dompurify'; // sanitize server-provided highlight HTML

export function SearchAutocomplete() {
  const { query, setQuery, results, loading } = useSearchAutocomplete();
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const allItems = [...results.categories, ...results.products];
  const isOpen = query.length >= 2 && allItems.length > 0;

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIndex >= 0) window.location.href = allItems[activeIndex].url;
    if (e.key === 'Escape') { inputRef.current.blur(); setActiveIndex(-1); }
  }

  return (
    <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" aria-owns="autocomplete-list">
      <input ref={inputRef} type="search" value={query}
        onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list" aria-controls="autocomplete-list"
        aria-activedescendant={activeIndex >= 0 ? `item-${activeIndex}` : undefined}
        placeholder="Search products..." />
      {loading && <span aria-live="polite" className="sr-only">Loading suggestions</span>}
      {isOpen && (
        <ul id="autocomplete-list" role="listbox" className="autocomplete-dropdown">
          {results.categories.map((cat, i) => (
            <li key={cat.url} id={`item-${i}`} role="option" aria-selected={activeIndex === i}>
              <a href={cat.url}>Category: {cat.name} ({cat.product_count})</a>
            </li>
          ))}
          {results.products.map((product, i) => {
            const idx = i + results.categories.length;
            const highlighted = DOMPurify.sanitize(product._highlightResult?.name?.value ?? product.name);
            return (
              <li key={product.objectID} id={`item-${idx}`} role="option" aria-selected={activeIndex === idx}>
                <a href={product.url} className="product-suggestion">
                  <img src={product.image} alt="" width="40" height="40" />
                  <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                  <span>${product.price}</span>
                </a>
              </li>
            );
          })}
          <li><a href={`/search?q=${encodeURIComponent(query)}`}>View all results for "{query}"</a></li>
        </ul>
      )}
    </div>
  );
}
```

**Algolia index configuration (typo tolerance + synonyms + merchandising):**
```javascript
await searchClient.setSettings({
  indexName: 'products',
  indexSettings: {
    searchableAttributes: ['name', 'brand', 'category', 'description'],
    customRanking: ['desc(popularity_score)', 'desc(conversion_rate)'],
    typoTolerance: 'min',
    minWordSizefor1Typo: 5,
    synonyms: [
      { objectID: 'shoes', type: 'synonym', synonyms: ['shoes', 'sneakers', 'footwear', 'trainers'] },
    ],
    optionalFilters: ['is_featured:true<score=2>', 'in_stock:true<score=1>'],
  },
});
```

## Best Practices

- **Debounce at 200–300 ms** — balances responsiveness and server load; do not go below 150 ms
- **Cancel in-flight requests** — use `AbortController` to avoid race conditions when the user types quickly
- **Highlight matched terms** — wrap matched substrings in `<mark>` so shoppers see why a result appeared; sanitize server-supplied HTML before rendering
- **Show a "View all results" link** — always provide an escape hatch to the full search results page
- **Cache frequent queries** — most stores have a small set of high-frequency queries; an LRU cache cuts backend load significantly
- **Track no-results queries** — log queries returning zero results; these are direct signals for synonym gaps or catalog holes
- **Set minChars to 2** — single-character queries produce noise and return no conversion value

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Stale results when user types fast | Use `AbortController` to cancel the previous request before issuing a new one |
| Dropdown appears behind sticky header | Set `z-index` explicitly on the dropdown; use a portal if inside an `overflow:hidden` ancestor |
| Keyboard navigation focus lost on re-render | Track `activeIndex` in component state, not DOM focus; re-apply `aria-activedescendant` on each render |
| Fuzzy matching returns irrelevant results | Configure `minWordSizefor1Typo: 5` in Algolia or `prefix_length: 2` in Elasticsearch to require a solid stem before fuzzy kicks in |
| Merchandising rules not applying | Rules trigger when the query matches the condition pattern — use `anchoring: 'contains'` not `is` for partial matches |

## Related Skills

- @faceted-navigation
- @product-page-design
- @accessibility-commerce
- @storefront-theming
