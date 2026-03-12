# Build a Product Tagging Page for a Shopify Embedded App

## Problem/Feature Description

A Shopify agency is building a bulk product tagging tool for merchants. Merchants need to be able to select products from their store, apply a set of tags to them all at once, and get confirmation feedback — all without leaving the Shopify Admin interface. The tool is a Remix-based embedded app running inside the Shopify Admin iframe.

The UI team has been told to make the tagging page feel like a native part of the Shopify Admin — not a third-party app bolted on. That means using Shopify's own component library throughout, following Shopify's interaction patterns for resource selection and notifications, and navigating between pages in a way that doesn't break the embedded iframe environment. A previous prototype tried using browser-native elements and standard React Router navigation, but merchants reported the page "flickering" and browser alert popups that looked jarring and out of place.

Write the Remix route file for this product tagging page. The page should allow a merchant to open a product picker, display selected products, accept a tag input, submit the tag via a Remix action that calls the Admin GraphQL API, and confirm success to the merchant. The GraphQL mutation and the session authentication should be included.

## Output Specification

- `app/routes/app.tagging.tsx` — the full Remix route with loader, action, and React component for the product tagging page

The file should be complete and self-contained (imports, loader/action, and component all in one file). You may reference `../shopify.server` for the authenticate export.
