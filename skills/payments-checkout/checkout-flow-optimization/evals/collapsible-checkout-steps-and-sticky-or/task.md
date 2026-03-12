# Redesign Checkout Page Layout for a Home Decor Store

## Problem Description

Willow & Oak is a home decor e-commerce brand doing a full storefront redesign. Their current checkout is a plain single HTML page with a long scrolling form — no structure, no sense of progress, and the cart disappears once you start filling out your details. Mobile users in particular drop off because the form feels overwhelming with no indication of how far they are through the process.

The product team wants a redesigned checkout page with a clear sense of progression through the purchase journey: contact information, then delivery details, then payment. Each section should feel contained and approachable. The design team has also requested that the basket summary remain visible throughout so customers can always see what they are buying. The page needs to work well on both desktop and mobile.

The team is particularly concerned about users who go back to change a previous step losing the data they already entered in later steps.

## Output Specification

Implement the redesigned checkout page as React components. Produce the following files:

- `CheckoutPage.jsx` — the main checkout page with step management logic
- `CheckoutSection.jsx` — a reusable collapsible section component used for each step
- `CheckoutProgress.jsx` — a progress indicator component showing which steps are complete and which is active
- `OrderSummary.jsx` — the order summary panel component
- `checkout-layout.css` — CSS for the responsive page layout

Stub out the inner form components (e.g. `<ContactForm />`, `<ShippingForm />`, `<PaymentForm />`) — they do not need to be fully functional, but the section management and layout must be complete.

Leave all output files in the working directory when done.
