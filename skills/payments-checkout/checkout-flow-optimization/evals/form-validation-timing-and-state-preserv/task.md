# Build a Robust Checkout Form with Smart Validation

## Problem Description

HomeNest, an online home goods retailer, recently ran a usability study on their checkout page. Participants complained that the form was aggressive — showing red errors immediately as they started typing, which felt intrusive. Others lost all their carefully entered contact and shipping details when a card payment was declined, forcing them to re-type everything. A handful of international customers were confused that the country field defaulted to the US even though they were browsing from abroad.

The engineering team wants to rebuild the checkout form with a more polished interaction model that reduces frustration and data loss. The form must collect contact information (email, phone), a shipping address (street, city, state, ZIP, country), and payment details (card number). It also needs to hold on to what the customer typed even if they accidentally navigate away mid-checkout.

## Output Specification

Implement the checkout form as React components and hooks. Produce the following files:

- `useCheckoutForm.js` — a custom hook managing form values, validation, and persistence
- `CheckoutForm.jsx` — the full checkout form component with contact, shipping, and payment sections
- `CheckoutForm.css` — basic styles including how errors are displayed

The payment step does not need to connect to a real payment processor. Simulate a card-declined scenario with a button or function that triggers an error so the behavior around field preservation can be demonstrated.

Leave all output files in the working directory when done.
