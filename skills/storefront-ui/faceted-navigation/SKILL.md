---
name: faceted-navigation
description: "Build filterable product listings with multi-select facets and URL-driven state"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [facets, filters, navigation, search, url-state, product-listing, plp]
triggers: ["add product filters", "faceted search", "filter by category", "product listing filters", "multi-select facets", "filterable products"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Faceted Navigation

## Overview

Build a filterable product listing page (PLP) where shoppers can narrow results by multiple attributes simultaneously — size, color, brand, price range, rating — while keeping the URL in sync so filters are shareable, bookmarkable, and crawlable by search engines. Combines server-side facet counting with client-side URL state management to deliver sub-200 ms filter interactions.

## When to Use This Skill

- When a product catalog exceeds ~50 SKUs and browse-only navigation causes shopper frustration
- When building or redesigning a category/collection listing page
- When SEO requires crawlable faceted URLs (e.g., `/shoes/running?color=black&size=10`)
- When replacing a legacy faceted implementation that breaks the back button
- When implementing Algolia InstantSearch or a custom faceting layer on Elasticsearch

## Core Instructions

1. **Design the URL state schema**

   All active filters live in the URL query string. Use a consistent multi-value convention so sharing and back-navigation work without JavaScript state management.

   ```
   /products/shoes?brand=Nike&brand=Adidas&color=black&size=10&price_min=50&price_max=150&sort=price_asc&page=1
   ```

   Parse the URL on mount and on `popstate` to derive the current filter state:

   ```javascript
   // lib/facetUrl.js
   export function parseFiltersFromUrl(searchParams) {
     const filters = {};
     for (const [key, value] of searchParams.entries()) {
       if (['sort', 'page', 'q'].includes(key)) continue;
       if (!filters[key]) filters[key] = [];
       filters[key].push(value);
     }
     return filters;
   }

   export function buildUrlFromFilters(filters, sort, page, query) {
     const params = new URLSearchParams();
     for (const [facetKey, values] of Object.entries(filters)) {
       values.forEach(v => params.append(facetKey, v));
     }
     if (sort) params.set('sort', sort);
     if (page && page > 1) params.set('page', String(page));
     if (query) params.set('q', query);
     return `?${params.toString()}`;
   }
   ```

2. **Fetch products and facet counts from the server**

   Each filter change triggers a new query that returns both the current page of products AND updated facet counts reflecting the current filter context.

   ```javascript
   // api/products/search.js
   export async function searchProducts({ filters, sort, page, query }) {
     const algoliaFilters = buildAlgoliaFilterString(filters);

     const result = await index.search(query ?? '', {
       filters: algoliaFilters,
       facets: ['brand', 'color', 'size', 'price_range', 'rating'],
       facetFilters: buildFacetFilters(filters),
       hitsPerPage: 24,
       page: page - 1,
       sort: sortToAlgoliaIndex(sort),
     });

     return {
       products: result.hits,
       facets: result.facets,         // { brand: { Nike: 42, Adidas: 31 }, color: { black: 55 } }
       totalCount: result.nbHits,
       totalPages: result.nbPages,
     };
   }

   function buildAlgoliaFilterString(filters) {
     const parts = [];
     if (filters.price_min) parts.push(`price >= ${filters.price_min[0]}`);
     if (filters.price_max) parts.push(`price <= ${filters.price_max[0]}`);
     return parts.join(' AND ');
   }

   function buildFacetFilters(filters) {
     // facetFilters = OR within a facet, AND between facets
     return Object.entries(filters)
       .filter(([k]) => !['price_min', 'price_max'].includes(k))
       .map(([facetKey, values]) => values.map(v => `${facetKey}:${v}`));
   }
   ```

3. **Build the FacetPanel component**

   Render each facet group with a checkbox list and count badges. Disable values with 0 results in the current context.

   ```jsx
   // FacetPanel.jsx
   export function FacetPanel({ facetDefinitions, facetCounts, activeFilters, onFilterChange }) {
     return (
       <aside aria-label="Product filters">
         {facetDefinitions.map(facet => (
           <FacetGroup
             key={facet.key}
             facet={facet}
             counts={facetCounts[facet.key] ?? {}}
             activeValues={activeFilters[facet.key] ?? []}
             onToggle={(value) => onFilterChange(facet.key, value)}
           />
         ))}
       </aside>
     );
   }

   function FacetGroup({ facet, counts, activeValues, onToggle }) {
     const [expanded, setExpanded] = useState(true);
     const sortedValues = Object.entries(counts).sort(([,a],[,b]) => b - a);

     return (
       <div className="facet-group">
         <button
           aria-expanded={expanded}
           aria-controls={`facet-${facet.key}`}
           onClick={() => setExpanded(e => !e)}
           className="facet-heading"
         >
           {facet.label}
           {activeValues.length > 0 && (
             <span className="badge">{activeValues.length}</span>
           )}
         </button>
         {expanded && (
           <ul id={`facet-${facet.key}`} role="group" aria-label={`${facet.label} filters`}>
             {sortedValues.map(([value, count]) => {
               const id = `facet-${facet.key}-${value}`;
               const isActive = activeValues.includes(value);
               return (
                 <li key={value}>
                   <label htmlFor={id} className={count === 0 ? 'disabled' : ''}>
                     <input
                       id={id}
                       type="checkbox"
                       checked={isActive}
                       disabled={count === 0 && !isActive}
                       onChange={() => onToggle(value)}
                     />
                     <span className="facet-value">{value}</span>
                     <span className="facet-count" aria-label={`${count} products`}>({count})</span>
                   </label>
                 </li>
               );
             })}
           </ul>
         )}
       </div>
     );
   }
   ```

4. **Manage filter state and sync to URL**

   ```javascript
   // useFacetedNavigation.js
   import { useState, useEffect, useCallback } from 'react';
   import { parseFiltersFromUrl, buildUrlFromFilters } from '../lib/facetUrl';

   export function useFacetedNavigation() {
     const [filters, setFilters] = useState(() =>
       parseFiltersFromUrl(new URLSearchParams(window.location.search))
     );
     const [sort, setSort] = useState(
       new URLSearchParams(window.location.search).get('sort') ?? 'relevance'
     );
     const [page, setPage] = useState(
       parseInt(new URLSearchParams(window.location.search).get('page') ?? '1')
     );

     // Sync URL -> state on browser back/forward
     useEffect(() => {
       const handler = () => {
         const params = new URLSearchParams(window.location.search);
         setFilters(parseFiltersFromUrl(params));
         setSort(params.get('sort') ?? 'relevance');
         setPage(parseInt(params.get('page') ?? '1'));
       };
       window.addEventListener('popstate', handler);
       return () => window.removeEventListener('popstate', handler);
     }, []);

     const toggleFilter = useCallback((facetKey, value) => {
       setFilters(prev => {
         const current = prev[facetKey] ?? [];
         const next = current.includes(value)
           ? current.filter(v => v !== value)
           : [...current, value];
         const updated = next.length ? { ...prev, [facetKey]: next } : (() => {
           const { [facetKey]: _, ...rest } = prev;
           return rest;
         })();
         const url = buildUrlFromFilters(updated, sort, 1); // reset to page 1 on filter change
         window.history.pushState({}, '', url);
         setPage(1);
         return updated;
       });
     }, [sort]);

     const clearAll = useCallback(() => {
       setFilters({});
       window.history.pushState({}, '', '?');
       setPage(1);
     }, []);

     return { filters, sort, setSort, page, setPage, toggleFilter, clearAll };
   }
   ```

5. **Add a price range slider facet**

   Numeric range facets need special handling — use a dual-thumb range input rather than checkboxes.

   ```jsx
   // PriceRangeFacet.jsx
   export function PriceRangeFacet({ min, max, value, onChange }) {
     const [localMin, setLocalMin] = useState(value?.min ?? min);
     const [localMax, setLocalMax] = useState(value?.max ?? max);

     // Commit only on mouseup/touchend to avoid excessive API calls
     function handleCommit() {
       onChange({ min: localMin, max: localMax });
     }

     return (
       <div className="price-range-facet">
         <span>${localMin} - ${localMax}</span>
         <div className="range-inputs">
           <input type="range" min={min} max={max} value={localMin}
             onChange={e => setLocalMin(Number(e.target.value))}
             onMouseUp={handleCommit} onTouchEnd={handleCommit}
             aria-label="Minimum price" />
           <input type="range" min={min} max={max} value={localMax}
             onChange={e => setLocalMax(Number(e.target.value))}
             onMouseUp={handleCommit} onTouchEnd={handleCommit}
             aria-label="Maximum price" />
         </div>
       </div>
     );
   }
   ```

## Examples

### Active filter pills / breadcrumb

Show applied filters as dismissible pills above the product grid so shoppers can easily remove individual filters:

```jsx
function ActiveFilterPills({ filters, onRemove, onClearAll }) {
  const pills = Object.entries(filters).flatMap(([key, values]) =>
    values.map(value => ({ key, value, label: `${key}: ${value}` }))
  );
  if (pills.length === 0) return null;
  return (
    <div className="active-filters" aria-label="Active filters">
      {pills.map(pill => (
        <button key={`${pill.key}-${pill.value}`} onClick={() => onRemove(pill.key, pill.value)}
          className="filter-pill">
          {pill.label} &times;
        </button>
      ))}
      <button onClick={onClearAll} className="clear-all">Clear all</button>
    </div>
  );
}
```

### SEO canonical URL for faceted pages

To prevent duplicate content penalties, emit a canonical tag pointing to the unfaceted URL for facet combinations that create new pages:

```jsx
// In your page <head>
const canonicalUrl = isIndexableFacetCombo(activeFilters)
  ? buildCanonicalFacetUrl(baseUrl, activeFilters)
  : baseUrl; // non-indexable combos point back to base

<link rel="canonical" href={canonicalUrl} />
```

## Best Practices

- **Encode filter state in the URL** — never store active filters only in React/Vue state; the URL is the source of truth
- **Return facet counts in every search response** — counts must reflect the current filter context, not the global catalog; a selected facet should still show counts for sibling values
- **Implement "disjunctive" (OR) facets within a group** — selecting Nike AND Adidas should show products from either brand, not an empty intersection
- **Debounce price range changes** — commit the range only on mouseup/touchend, not on every slider tick
- **Show skeleton loaders during filter transitions** — product grid should fade/skeleton while new results load to prevent layout shift
- **Add a "Clear all" affordance** — always visible when any filter is active
- **Limit facet overflow to top N values** — show top 10 values with a "Show more" toggle to prevent overly long panels on mobile

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Back button reloads page instead of removing last filter | Use `history.pushState` (not `replaceState`) for each filter change so each state has its own history entry |
| Facet counts go stale after first filter selection | Re-fetch facet counts from the server on every filter change, including the currently-active facets (use Algolia disjunctive faceting) |
| Mobile filter panel overlaps content | Implement filter panel as a drawer/modal on mobile triggered by a "Filters" button; use `position:fixed` with `inset:0` |
| SEO duplicate content from facet URLs | Add `rel="noindex"` or canonical tags for non-primary facet combinations; index only high-value facet pages (e.g., brand+category) |
| Price range slider thumbs overlap | Clamp max thumb minimum to current min+step and min thumb maximum to current max-step on every change event |

## Related Skills

- @search-autocomplete
- @product-categorization
- @accessibility-commerce
- @product-page-design
