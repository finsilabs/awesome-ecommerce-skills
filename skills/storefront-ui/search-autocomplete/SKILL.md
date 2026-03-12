---
name: search-autocomplete
description: "Implement typeahead search with fuzzy matching, filters, and merchandising rules"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [search, autocomplete, typeahead, fuzzy-matching, merchandising, algolia, elasticsearch]
triggers: ["add search autocomplete", "implement typeahead search", "product search suggestions", "search as you type", "fuzzy search"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
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

1. **Set up debounced input handler**

   Prevent excessive API calls by debouncing the input event. 200-300 ms is the sweet spot for perceived responsiveness without hammering your backend.

   ```javascript
   // useSearchAutocomplete.js
   import { useState, useEffect, useRef, useCallback } from 'react';

   function debounce(fn, delay) {
     let timer;
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => fn(...args), delay);
     };
   }

   export function useSearchAutocomplete(minChars = 2) {
     const [query, setQuery] = useState('');
     const [results, setResults] = useState({ products: [], categories: [], suggestions: [] });
     const [loading, setLoading] = useState(false);
     const abortRef = useRef(null);

     const fetchSuggestions = useCallback(
       debounce(async (q) => {
         if (q.length < minChars) {
           setResults({ products: [], categories: [], suggestions: [] });
           return;
         }

         // Cancel previous in-flight request
         if (abortRef.current) abortRef.current.abort();
         abortRef.current = new AbortController();

         setLoading(true);
         try {
           const res = await fetch(
             `/api/search/autocomplete?q=${encodeURIComponent(q)}&limit=5`,
             { signal: abortRef.current.signal }
           );
           const data = await res.json();
           setResults(data);
         } catch (err) {
           if (err.name !== 'AbortError') console.error(err);
         } finally {
           setLoading(false);
         }
       }, 250),
       [minChars]
     );

     useEffect(() => { fetchSuggestions(query); }, [query, fetchSuggestions]);

     return { query, setQuery, results, loading };
   }
   ```

2. **Build the server-side autocomplete endpoint**

   The endpoint should search across multiple indices (products, categories, pages) and apply merchandising boosts.

   ```javascript
   // api/search/autocomplete.js (Node/Express)
   import { searchClient } from '../lib/algolia'; // or your search provider

   export async function autocompleteHandler(req, res) {
     const { q, limit = 5 } = req.query;
     if (!q || q.length < 2) {
       return res.json({ products: [], categories: [], suggestions: [] });
     }

     const [productsResult, categoriesResult] = await Promise.all([
       searchClient.search({
         indexName: 'products',
         query: q,
         params: {
           hitsPerPage: parseInt(limit),
           attributesToRetrieve: ['objectID', 'name', 'image', 'price', 'url', 'category'],
           attributesToHighlight: ['name'],
           typoTolerance: true,
           // Merchandising: boost in-stock, pinned items via optional filters or rules
           optionalFilters: ['is_featured:true<score=2>', 'in_stock:true<score=1>'],
         },
       }),
       searchClient.search({
         indexName: 'categories',
         query: q,
         params: {
           hitsPerPage: 3,
           attributesToRetrieve: ['name', 'url', 'product_count'],
         },
       }),
     ]);

     res.json({
       products: productsResult.hits,
       categories: categoriesResult.hits,
       suggestions: productsResult.facets?.query_suggestions?.slice(0, 4) ?? [],
     });
   }
   ```

3. **Render the dropdown with keyboard navigation**

   Implement ARIA-compliant combobox pattern (role="combobox", role="listbox") with full keyboard support.

   Note: When rendering server-provided highlight HTML, sanitize it with DOMPurify first.

   ```jsx
   // SearchAutocomplete.jsx
   import { useSearchAutocomplete } from './useSearchAutocomplete';
   import { useRef, useState } from 'react';
   import DOMPurify from 'dompurify';

   export function SearchAutocomplete() {
     const { query, setQuery, results, loading } = useSearchAutocomplete();
     const [activeIndex, setActiveIndex] = useState(-1);
     const inputRef = useRef(null);
     const isOpen = query.length >= 2 &&
       (results.products.length > 0 || results.categories.length > 0);
     const allItems = [...results.categories, ...results.products];

     function handleKeyDown(e) {
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setActiveIndex(i => Math.max(i - 1, -1));
       }
       if (e.key === 'Enter' && activeIndex >= 0) {
         window.location.href = allItems[activeIndex].url;
       }
       if (e.key === 'Escape') {
         inputRef.current.blur();
         setActiveIndex(-1);
       }
     }

     return (
       <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" aria-owns="autocomplete-list">
         <input
           ref={inputRef}
           type="search"
           value={query}
           onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
           onKeyDown={handleKeyDown}
           aria-autocomplete="list"
           aria-controls="autocomplete-list"
           aria-activedescendant={activeIndex >= 0 ? `item-${activeIndex}` : undefined}
           placeholder="Search products..."
         />
         {loading && <span aria-live="polite" className="spinner" aria-label="Loading suggestions" />}
         {isOpen && (
           <ul id="autocomplete-list" role="listbox" className="autocomplete-dropdown">
             {results.categories.map((cat, i) => (
               <li key={cat.url} id={`item-${i}`} role="option" aria-selected={activeIndex === i}
                   className={activeIndex === i ? 'active' : ''}>
                 <a href={cat.url}>
                   <span className="prefix">Category: </span>
                   {cat.name} ({cat.product_count})
                 </a>
               </li>
             ))}
             {results.products.map((product, i) => {
               const idx = i + results.categories.length;
               // Sanitize server-provided highlight markup before rendering as HTML
               const highlightedName = DOMPurify.sanitize(
                 product._highlightResult?.name?.value ?? product.name
               );
               return (
                 <li key={product.objectID} id={`item-${idx}`} role="option"
                     aria-selected={activeIndex === idx}
                     className={activeIndex === idx ? 'active' : ''}>
                   <a href={product.url} className="product-suggestion">
                     <img src={product.image} alt="" width="40" height="40" />
                     <span dangerouslySetInnerHTML={{ __html: highlightedName }} />
                     <span className="price">${product.price}</span>
                   </a>
                 </li>
               );
             })}
           </ul>
         )}
       </div>
     );
   }
   ```

4. **Configure fuzzy matching and synonyms**

   Set up your search index with appropriate fuzzy matching tolerance and business synonyms.

   ```javascript
   // scripts/configure-algolia-index.js
   await searchClient.setSettings({
     indexName: 'products',
     indexSettings: {
       searchableAttributes: [
         'name',              // Highest priority
         'brand',
         'category',
         'description',       // Lowest priority
       ],
       customRanking: ['desc(popularity_score)', 'desc(conversion_rate)'],
       typoTolerance: 'min',   // Allow 1 typo for words >= 5 chars
       minWordSizefor1Typo: 5,
       minWordSizefor2Typos: 9,
       synonyms: [
         { objectID: 'shoes', type: 'synonym', synonyms: ['shoes', 'sneakers', 'footwear', 'trainers'] },
         { objectID: 'tv',    type: 'synonym', synonyms: ['tv', 'television', 'flat screen'] },
       ],
     },
   });
   ```

5. **Add merchandising rules (query-level pinning and boosting)**

   ```javascript
   // Pin "New Arrivals" collection result when query contains "new"
   await searchClient.saveRule({
     indexName: 'products',
     rule: {
       objectID: 'boost-new-arrivals',
       conditions: [{ pattern: 'new', anchoring: 'contains' }],
       consequence: {
         filterPromotes: true,
         promote: [{ objectID: 'collection-new-arrivals', position: 0 }],
       },
     },
   });
   ```

## Examples

### Typesense self-hosted alternative

If you need a cost-effective, self-hosted option instead of Algolia:

```javascript
import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
});

const results = await client.collections('products').documents().search({
  q: query,
  query_by: 'name,brand,category',
  prefix: true,
  num_typos: 1,
  highlight_full_fields: 'name',
  per_page: 5,
});
```

### Elasticsearch fuzzy query

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "match_phrase_prefix": {
            "name": { "query": "QUERY_STRING", "boost": 3 }
          }
        },
        {
          "multi_match": {
            "query": "QUERY_STRING",
            "fields": ["name^2", "brand", "category"],
            "fuzziness": "AUTO",
            "prefix_length": 2
          }
        }
      ]
    }
  },
  "size": 5
}
```

## Best Practices

- **Debounce at 200-300 ms** — balances responsiveness and server load; do not go below 150 ms
- **Cancel in-flight requests** — use `AbortController` to avoid race conditions when the user types quickly
- **Highlight matched terms** — wrap matched substrings in `<mark>` or `<em>` so shoppers see why a result appeared; always sanitize server-supplied HTML with DOMPurify before rendering
- **Show a "View all results" link** — always provide an escape hatch to the full search results page
- **Cache frequent queries** — most storefronts have a small set of high-frequency queries; a simple LRU cache cuts backend load by 40-60%
- **Track no-results queries** — log queries returning zero results to your analytics; these are direct signals for synonym or catalog gaps
- **Set minChars to 2** — single-character queries produce noise and hit backend hard with no conversion value
- **Preload on focus** — on input focus (before typing), fetch trending searches to fill an empty state

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Stale results appearing when user types fast | Use `AbortController` to cancel the previous request before issuing a new one |
| Dropdown appears behind sticky header or modal | Set `z-index` explicitly on the dropdown container; use a portal (`createPortal`) if inside an `overflow:hidden` ancestor |
| Keyboard navigation focus lost on re-render | Track `activeIndex` in component state, not DOM focus; re-apply `aria-activedescendant` on each render |
| Fuzzy matching returns irrelevant results | Configure `prefix_length: 2` in Elasticsearch or `minWordSizefor1Typo: 5` in Algolia to require a solid stem before fuzzy kicks in |
| Merchandising rules not applying | Rules only trigger when the query matches the condition pattern — use `anchoring: 'contains'` not `is` for partial matches |

## Related Skills

- @faceted-navigation
- @product-page-design
- @product-categorization
- @accessibility-commerce
