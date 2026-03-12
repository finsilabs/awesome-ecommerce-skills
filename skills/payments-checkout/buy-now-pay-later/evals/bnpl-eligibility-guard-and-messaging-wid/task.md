# Add BNPL Installment Messaging to Product and Cart Pages

## Problem/Feature Description

A consumer electronics retailer sells products ranging from $8 phone cases to $4,000 laptops. They have recently enabled Klarna and Afterpay as checkout payment options but are not yet showing any installment messaging on their product detail pages or cart. The growth team has shared research indicating that displaying "pay over time" messaging before the customer reaches checkout meaningfully increases conversion and average order value — but only when the messaging is accurate and only displayed for qualifying order amounts.

The development team needs a set of React components that display installment messaging widgets from Afterpay and Klarna on the product page and in the cart. The components must handle the fact that product prices vary widely across the catalog, and that the store ships to multiple countries (US, UK, Australia, Canada, Germany). The components should only appear when the price and customer's country actually qualify for a given provider, and the Klarna widget must stay in sync when a customer switches between product variants with different prices.

Additionally, provide a utility function the rest of the codebase can use to determine which BNPL providers are available for a given order.

## Output Specification

Produce the following files:

- `lib/bnplEligibility.js` — A module exporting a function to determine which BNPL providers are available for a given order total and country code.
- `components/AfterpayMessage.jsx` — React component that shows the Afterpay installment widget for a given price. Should not render if the price is ineligible.
- `components/KlarnaMessage.jsx` — React component that shows the Klarna installment widget for a given price. Should stay in sync when the price prop changes. Should not render if the price is ineligible.
- `components/BNPLMessaging.jsx` — A wrapper component that accepts `price` and `countryCode` props and renders the appropriate BNPL messaging widgets based on eligibility.
- `bnpl-eligibility.test.js` — Unit tests (using any test framework) that verify the eligibility function returns correct results for at least 5 different price/country combinations, including edge cases at the boundaries of provider ranges.
