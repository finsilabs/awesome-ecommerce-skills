# Build a Quick View Modal Component

## Problem/Feature Description

Vesper Clothing is adding a product preview feature to their collection pages. When a shopper clicks "Quick View" on any product card, a modal overlay should appear and load that product's details from a REST API endpoint at `/api/products/{id}/quick-view`. While the data is fetching, the modal must communicate loading state clearly — both visually and to screen readers.

The accessibility team has flagged that after a modal closes, keyboard users often lose their place on the page. The modal must return keyboard focus to whichever element triggered it, so users can continue browsing without losing context.

The team also wants users to be able to dismiss the overlay by clicking on the dark backdrop outside the modal content area, in addition to the standard close button.

Your job is to implement two things:
1. A `QuickViewModal` React component that handles all the above requirements
2. A `useQuickView` custom React hook that manages open/close state and the async product fetch

## Output Specification

Produce the following files:

- `useQuickView.js` — the custom hook managing open/close state and async product fetching
- `QuickViewModal.jsx` — the modal component
- `QuickViewModal.css` — styles for the modal including the backdrop
