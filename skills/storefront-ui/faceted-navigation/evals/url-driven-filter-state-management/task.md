# Shareable Product Filter URLs

## Problem/Feature Description

The e-commerce team at Northbrook Outdoor Gear has a product listing page where shoppers can filter by brand, color, size, and price. The current implementation stores all filter selections in React component state — meaning filters are lost whenever a shopper copies and pastes the URL to share with a friend, refreshes the page, or uses the browser back button after clicking into a product detail page. The marketing team is also frustrated because they can't deep-link to pre-filtered views in email campaigns.

You have been asked to build the URL state management layer for the filtering system: a pair of utility functions for serializing/deserializing filter state to/from the URL query string, and a React hook that keeps the UI in sync with the URL. The system must handle multi-select facets (e.g., selecting both Nike and Adidas for the brand facet), support sort and page parameters alongside the filter values, and correctly restore filter state when a user navigates back with the browser.

## Output Specification

Produce the following files:

- `lib/facetUrl.js` — URL serialization utilities (parse and build functions)
- `hooks/useFacetedNavigation.js` — React hook for filter state management synchronized to the URL
- `IMPLEMENTATION_NOTES.md` — A brief document (bullet points are fine) describing: how multi-value filters are represented in the URL, how the hook handles browser back/forward navigation, and what happens when a filter's last selected value is removed

## Input Files

The following partial implementation exists as a starting point. Extract it before beginning.

=============== FILE: src/ProductListingPage.jsx ===============
import React from 'react';

// TODO: replace this stub with the real URL-driven hook
function useStubFilters() {
  const [filters, setFilters] = React.useState({});
  const [sort, setSort] = React.useState('relevance');
  const [page, setPage] = React.useState(1);

  const toggleFilter = (facetKey, value) => {
    setFilters(prev => {
      const current = prev[facetKey] ?? [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [facetKey]: next };
    });
  };

  const clearAll = () => setFilters({});

  return { filters, sort, setSort, page, setPage, toggleFilter, clearAll };
}

export function ProductListingPage({ products }) {
  const { filters, sort, setSort, page, setPage, toggleFilter, clearAll } = useStubFilters();

  return (
    <div>
      <h1>Products</h1>
      <p>Active filters: {JSON.stringify(filters)}</p>
      <button onClick={() => toggleFilter('brand', 'Nike')}>Toggle Nike</button>
      <button onClick={() => toggleFilter('brand', 'Adidas')}>Toggle Adidas</button>
      <button onClick={() => toggleFilter('color', 'black')}>Toggle Black</button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}
