# Screen Reader Support for a Shopping Cart Page

## Problem/Feature Description

A mid-size online retailer has launched a React-based storefront and recently received complaints from blind and low-vision customers. When users add items to the cart or adjust quantities, their screen readers (NVDA, VoiceOver) announce nothing — shoppers have no way to confirm their cart was updated without tabbing to the cart icon and trying to read a number badge that announces as just "3" with no context. A third-party accessibility audit has marked the cart page as non-compliant and the company needs it fixed before an upcoming compliance review.

The existing cart page renders a list of line items, each with a name, price, and a quantity control (−/+ buttons and a number input). There is also a cart icon in the header that shows a count badge. Your task is to produce an accessible React implementation of this cart page that solves the screen reader announcement problems.

## Output Specification

Produce a single self-contained file `cart-accessible.jsx` (or `cart-accessible.tsx`) that implements the accessible cart page. The file should include:

- A `CartLiveRegion` component (or equivalent) that announces cart state changes
- A `QuantityStepper` component for adjusting item quantities
- A `CartPage` component that wires them together, renders a list of at least two sample products, and shows a cart count badge in a header area
- All supporting CSS can be placed in an adjacent `cart-accessible.css` file or inline via a `<style>` block at the top of the JSX

The components do not need to connect to a real backend; use local React state. The final files should be ready for a developer to drop into a project and inspect.
