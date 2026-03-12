# Build a Complete Shopping Cart System

## Problem/Feature Description

An outdoor gear retailer is building a headless Shopify storefront using Hydrogen and needs a fully functional cart experience. Customers should be able to add products to the cart from product pages, update item quantities from the cart view, and remove items they no longer want. The team has already set up the Hydrogen project and Storefront API credentials, but the cart functionality hasn't been implemented yet.

A critical requirement is that the cart must work correctly across page navigations and even if a customer opens multiple tabs. The team had a bad experience with their previous storefront where cart state was stored in JavaScript memory and was lost on refresh — this new implementation must store cart state reliably on the server side so it persists across the session.

## Output Specification

Produce the following files:

1. `app/routes/cart.tsx` — The main cart route containing:
   - A Remix `action` function that handles adding, updating, and removing cart lines
   - A React component that renders the current cart contents

2. `app/components/AddToCartButton.tsx` — A reusable component that renders a button to add a specific product variant to the cart, accepting a `variantId` prop.

3. `CART_NOTES.md` — A brief explanation of how cart state is persisted across requests and why this approach is used.

The files should be complete TypeScript and importable into a running Hydrogen project. Use realistic product variant IDs as placeholder values where needed (e.g., `gid://shopify/ProductVariant/12345`).
