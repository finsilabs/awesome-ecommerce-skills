# Comparison State Hook and Data API

## Problem/Feature Description

A furniture retailer is launching a product comparison feature. The frontend team needs two things: a reusable React hook that keeps the list of selected product IDs in sync with the URL so shoppers can share or bookmark their comparison, and a server-side data function that fetches and normalises product records before the comparison table renders them.

The team has run into a specific issue in a previous prototype: navigating back and forward in the browser produced unexpected behaviour because every checkbox click added a new entry to browser history. The new hook must avoid this. Another problem in the prototype was that some furniture pieces do not have every specification filled in — the previous version silently dropped those cells, which misaligned table columns. The new data layer must handle absent attributes in a way that keeps the table structurally consistent.

The team also wants a complete CSS file for the comparison table so that it scrolls correctly on small screens and keeps the row labels visible while scrolling horizontally on larger screens.

## Output Specification

Produce the following files:

- `hooks/useProductComparison.js` — the URL-syncing comparison hook. Export `useProductComparison` which returns `{ comparedIds, toggle, clearAll }`.
- `api/comparison.js` — the data-fetching function. Export `getComparisonData(productIds)` that returns normalised product objects. Use the mock data below instead of a real database call.
- `ComparisonTable.css` — CSS for the table wrapper and column/row layout, including mobile scrolling behaviour and sticky positioning.
- `ARCHITECTURE.md` — a brief document (bullet points are fine) describing the key design decisions made in the hook and the data function, especially around URL management and missing attribute handling.

## Input Files

The following mock product database is provided. Extract it before beginning.

=============== FILE: inputs/mock-db.json ===============
[
  {
    "id": "sofa-001",
    "name": "CloudComfort 3-Seater",
    "slug": "cloudcomfort-3-seater",
    "price": 1299,
    "images": ["/img/cc3.jpg"],
    "attributes": [
      { "key": "material", "value": "Linen" },
      { "key": "seat_depth", "value": "60 cm" },
      { "key": "leg_material", "value": "Oak" },
      { "key": "removable_covers", "value": "Yes" },
      { "key": "weight_kg", "value": "45" }
    ],
    "variants": [{ "price": 1299 }]
  },
  {
    "id": "sofa-002",
    "name": "ModularLux Corner",
    "slug": "modularlux-corner",
    "price": 2199,
    "images": ["/img/mlcorner.jpg"],
    "attributes": [
      { "key": "material", "value": "Velvet" },
      { "key": "seat_depth", "value": "65 cm" },
      { "key": "leg_material", "value": "Metal" },
      { "key": "weight_kg", "value": "78" }
    ],
    "variants": [{ "price": 2199 }]
  },
  {
    "id": "sofa-003",
    "name": "SlimLine 2-Seater",
    "slug": "slimline-2-seater",
    "price": 799,
    "images": ["/img/slim2.jpg"],
    "attributes": [
      { "key": "material", "value": "Microfibre" },
      { "key": "seat_depth", "value": "55 cm" },
      { "key": "removable_covers", "value": "No" },
      { "key": "weight_kg", "value": "32" }
    ],
    "variants": [{ "price": 799 }]
  }
]
