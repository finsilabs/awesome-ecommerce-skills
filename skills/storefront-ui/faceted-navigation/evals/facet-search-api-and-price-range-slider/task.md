# Product Search API and Price Range Filter

## Problem/Feature Description

Trailhead Market, an outdoor gear e-commerce site, is building a new filtered product listing page. The engineering team needs two pieces: (1) a search API module that queries their Algolia index for products while applying facet filters correctly, and (2) a standalone price range UI component for the filter sidebar. The team ran into problems with their previous implementation — after a shopper selected a brand filter, the facet counts for other brands dropped to zero because the API was applying the brand filter to count lookups too. They also had reports of the price slider sending dozens of API requests per second as the user dragged it.

Your job is to build the search API module and the price range component. The search API should accept the current filter state (multi-select facets and a price range) and return products along with updated facet counts. The price range component should let users drag two handles to set a minimum and maximum price and only fire its callback when the user finishes adjusting the slider.

## Output Specification

Produce the following files:

- `api/searchProducts.js` — The search module (can use mock/stub Algolia calls if no real index is available — focus on the correct structure and filter-building logic)
- `components/PriceRangeFacet.jsx` — The dual-handle price range component
- `DESIGN_NOTES.md` — Document explaining: how facet filters are structured (OR vs AND logic), how the price range is handled differently from other facets, and how the component avoids excessive API calls

## Input Files

The following data shapes show what the API should receive and return. Extract them before beginning.

=============== FILE: types/search.js ===============
/**
 * Input to searchProducts()
 * @typedef {Object} SearchInput
 * @property {Object.<string, string[]>} filters  - e.g. { brand: ['Nike','Adidas'], color: ['black'] }
 *   price_min and price_max, if present, contain a single-element array with a numeric string
 * @property {string} sort    - e.g. 'price_asc', 'relevance', 'newest'
 * @property {number} page    - 1-indexed
 * @property {string} [query] - optional text search query
 */

/**
 * Output from searchProducts()
 * @typedef {Object} SearchResult
 * @property {Object[]} products   - array of product hit objects
 * @property {Object}   facets     - e.g. { brand: { Nike: 42, Adidas: 31 }, color: { black: 55 } }
 * @property {number}   totalCount
 * @property {number}   totalPages
 */

=============== FILE: config/algolia.js ===============
// Stub — replace with real credentials in production
export const ALGOLIA_APP_ID = 'YOUR_APP_ID';
export const ALGOLIA_SEARCH_KEY = 'YOUR_SEARCH_KEY';
export const ALGOLIA_INDEX_NAME = 'products';

export const FACET_FIELDS = ['brand', 'color', 'size', 'price_range', 'rating'];
export const HITS_PER_PAGE = 24;
