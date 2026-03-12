# Product Filter Panel Component

## Problem/Feature Description

StyleHub, an online fashion retailer, is rebuilding its product listing page to improve both usability and accessibility. Their current filter sidebar is a simple static list that doesn't show how many products match each option, makes it hard to see which filters are active, and fails several WCAG accessibility audits. Customer support frequently receives complaints from shoppers who can't tell which filters they've selected, can't remove individual filters without clearing everything, and find the sidebar overwhelming on mobile because it lists all 60+ brand options at once.

You have been asked to build the React FacetPanel component that will replace the old sidebar. The component should receive facet definitions (the list of facets to show), current facet counts from the search engine, and the currently active filter selections, and render them as an interactive filter sidebar. A separate active-filters display should appear above the product grid showing what's currently selected with the ability to remove individual selections.

## Output Specification

Produce the following files:

- `components/FacetPanel.jsx` — The main filter sidebar component with collapsible facet groups
- `components/ActiveFilterPills.jsx` — The dismissible active-filter pills component shown above the product grid
- `COMPONENT_NOTES.md` — Document covering: how zero-count values are handled, how facet values are ordered, and the overflow behavior when a facet has many values

## Input Files

The following type definitions and stub data describe the expected interface. Extract them before beginning.

=============== FILE: types/facets.js ===============
/**
 * @typedef {Object} FacetDefinition
 * @property {string} key - e.g. 'brand'
 * @property {string} label - e.g. 'Brand'
 */

/**
 * @typedef {Object.<string, Object.<string, number>>} FacetCounts
 * example: { brand: { Nike: 42, Adidas: 31, Puma: 0 }, color: { black: 55, white: 30 } }
 */

/**
 * @typedef {Object.<string, string[]>} ActiveFilters
 * example: { brand: ['Nike'], color: ['black', 'white'] }
 */

=============== FILE: data/sampleFacets.js ===============
export const facetDefinitions = [
  { key: 'brand', label: 'Brand' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
];

export const sampleFacetCounts = {
  brand: {
    Nike: 42, Adidas: 31, Puma: 18, Reebok: 15, 'New Balance': 12,
    Asics: 9, Saucony: 7, Brooks: 6, Hoka: 5, Salomon: 4,
    Merrell: 3, Columbia: 2, 'The North Face': 1, Patagonia: 0,
  },
  color: { black: 55, white: 44, grey: 22, red: 18, blue: 12, green: 0 },
  size: { '10': 30, '9': 28, '11': 25, '8': 20, '12': 15, '7': 8, '13': 3 },
};

export const sampleActiveFilters = {
  brand: ['Nike', 'Adidas'],
  color: ['black'],
};
