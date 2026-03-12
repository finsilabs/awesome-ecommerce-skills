# Build a Shopify Collection Page Section

## Problem/Feature Description

A home goods retailer is launching a new Shopify store and needs a collection browsing page. Their catalog has hundreds of products across several collections, and shoppers need to be able to browse product thumbnails quickly without the page feeling slow or overwhelming. The team's previous theme used an older Shopify architecture, and the new theme must support the modern theme editor workflow so the marketing team can adjust the layout themselves.

The collection page should show product cards in a responsive grid, with the product name and price visible under each card. Because many collections have more than 24 products, the page needs to support pagination. Page load speed is a priority: product card images should load efficiently on all screen sizes and should not block the initial render.

Additionally, the section needs to be configurable from the theme editor, so merchants can tune the number of products per page and optionally enable a sort/filter bar.

## Output Specification

Produce the following theme files:

- `sections/collection-grid.liquid` — the section file with schema
- `templates/collection.json` — the JSON template that wires up the section
- Any supporting JS should be placed in `assets/` and referenced appropriately

The section should render a responsive product grid with card images, titles, and prices. Pagination should work for large collections. Include at least one configurable section setting (e.g. products per page) in the schema.
