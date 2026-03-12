# Product Listing Compare Selection UI

## Problem/Feature Description

A home appliances e-commerce store is adding a product comparison feature to its category pages. Shoppers browsing washing machines or refrigerators need to be able to tag multiple models for side-by-side review without leaving the listing page. The UX team has designed a two-part interaction: a checkbox on each product card that the shopper ticks to include a model, and a persistent bar that floats at the bottom of the screen showing which models are currently queued for comparison.

The engineering team needs React components for both the product card (with the comparison checkbox) and the floating tray. There is a hard constraint that the comparison must accommodate between 1 and a maximum number of products — the exact limit will be enforced in the UI itself so shoppers can never accidentally add more than allowed. The tray should give shoppers clear feedback about how many slots remain, offer a direct route to the comparison page, and let them remove individual items or wipe the entire selection.

## Output Specification

Produce the following files:

- `ProductCard.jsx` — product card component that accepts `product`, `comparedIds`, and `onToggleCompare` as props. Demonstrate it with a static list of three appliances.
- `ComparisonTray.jsx` — floating tray component that accepts `selectedProducts`, `onRemove`, and `onClear` as props.
- `ProductListing.jsx` — a parent component that wires `ProductCard` instances and the `ComparisonTray` together, managing local state for selected product IDs. It should also render a Compare button/link that targets the comparison page with the current selection encoded in the URL.
- `tray.css` — CSS for the floating tray layout and positioning.

Use the sample product data below to populate the demonstration.

## Input Files

The following sample data is provided. Extract it before beginning.

=============== FILE: inputs/products.json ===============
[
  { "id": "wm-101", "name": "CleanWave 7kg", "price": 349, "image": "/img/cleanwave.jpg" },
  { "id": "wm-102", "name": "SpinPro Deluxe", "price": 499, "image": "/img/spinpro.jpg" },
  { "id": "wm-103", "name": "EcoWash Slim", "price": 279, "image": "/img/ecowash.jpg" },
  { "id": "wm-104", "name": "TurboClean X9",  "price": 699, "image": "/img/turboclean.jpg" },
  { "id": "wm-105", "name": "AquaFresh Plus", "price": 419, "image": "/img/aquafresh.jpg" }
]
