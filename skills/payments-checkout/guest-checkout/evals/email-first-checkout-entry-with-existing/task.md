# Add Guest Checkout Entry to an Existing Storefront

## Problem/Feature Description

The engineering team at Bramblewick Shop has received feedback from their analytics team: 38% of customers abandon the checkout page before completing a purchase. The current checkout immediately redirects unauthenticated visitors to a login/registration screen, which frustrates first-time buyers. The product manager wants to add a guest-friendly entry point to the checkout that lets shoppers proceed without creating an account up front.

The team uses React for the frontend. The checkout currently starts with a login form. They want to replace this with an email-first step that smoothly handles both new visitors and returning customers who already have an account. The step must be practical and work as a self-contained React component. There is a backend endpoint at `/api/auth/check-email` that accepts `POST` requests with a JSON body `{ "email": "..." }` and returns `{ "exists": true/false }`.

## Output Specification

Produce a single React component file called `EmailStep.jsx` that implements the email-first checkout entry step. The component should accept two props: `onContinueAsGuest(email)` and `onLogin(email)`, and manage its own internal state. Also produce a short `notes.md` file explaining the key design decisions made in the component (2-4 bullet points).

The output files should be placed directly in the working directory.
