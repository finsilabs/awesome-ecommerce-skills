# Search Autocomplete API Endpoint

## Problem/Feature Description

A growing outdoor gear retailer is launching a new storefront and needs a backend autocomplete API. Their catalog lives in Algolia across two indices: `products` (150k records) and `categories` (800 records). The search team has noticed that their existing full-text search endpoint is too slow and returns too much data for the autocomplete use case — they want a dedicated, lean endpoint that returns relevant suggestions fast.

The ops team has also flagged two recurring production incidents on other services: one where popular search terms hammered the Algolia API unnecessarily (costing money and adding latency), and another where their analytics team couldn't identify why certain products weren't being found — they had no visibility into what searches were returning empty results.

Your task is to implement the `/api/search/autocomplete` endpoint in Node.js/Express using the `algoliasearch` package. The Algolia app ID and API key will be available as environment variables `ALGOLIA_APP_ID` and `ALGOLIA_SEARCH_KEY`. The endpoint must be production-ready and address the two operational concerns raised above.

## Output Specification

Produce the following files:
- `autocomplete.js` — the Express route handler implementing the autocomplete endpoint
- `README.md` — brief documentation covering: the response shape, any caching behavior, and how zero-result queries are handled
