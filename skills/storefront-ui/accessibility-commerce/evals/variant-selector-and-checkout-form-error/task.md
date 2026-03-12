# Accessible Product Detail Page: Variant Selection and Checkout Form

## Problem/Feature Description

A fashion retailer's development team has built a product detail page and a one-page checkout, but accessibility testers have flagged two major problem areas. First, the color and size selectors are implemented as `<div>` elements with click handlers — screen reader users cannot determine which color or size is selected, and out-of-stock options are visually greyed out but announced identically to available options. Second, the checkout form shows inline validation errors as floating tooltips that are never read aloud; a JAWS user reported completing the entire form incorrectly because no errors were ever announced.

The team also needs the price, sale price, and availability labels to meet WCAG AA color contrast requirements so the page passes automated audit tools.

Your task is to produce accessible React components that solve these two areas: a variant selector group and a checkout form field with inline error handling. The components should work standalone and reflect production-quality accessibility patterns.

## Output Specification

Produce the following files:

- `ColorSwatchGroup.jsx` — an accessible color variant selector
- `SizeSelector.jsx` — an accessible size variant selector (can reuse the same pattern as color if appropriate)
- `CheckoutField.jsx` — a reusable form field component with accessible inline error display
- `CheckoutForm.jsx` — a sample checkout form that uses `CheckoutField` for at least three fields (name, email, card number) and demonstrates client-side validation with errors shown on submit
- `styles.css` — CSS for the above components including color values for price, sale price, and out-of-stock badge

Include sample data (hardcoded color and size options) so the components render without external dependencies.
