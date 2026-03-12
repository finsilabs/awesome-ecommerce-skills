# Shopping Cart Frontend with Guest Session Support

## Problem/Feature Description

Bloom & Co, a boutique flower delivery service, is launching a React-based storefront. They want customers to be able to browse and add flowers to their cart without needing to create an account — and importantly, their cart should persist if they close the tab and return an hour later. The team is worried about security after reading about XSS attacks that steal session data, so they want the cart session to be as safe as possible.

On the frontend, the UX team has pushed back hard on any "loading spinner" shown every time a customer clicks "Add to Basket" — they want the cart icon to update instantly when the button is clicked, even if the API call hasn't completed yet. The team needs both a server-side session helper (Node.js) and a React cart context wired up together.

## Output Specification

Produce the following files:

- `lib/cartSession.js` — Node.js helper that creates or retrieves a cart for both authenticated and guest users
- `context/CartContext.jsx` — React context, provider, and `useCart` hook with cart state and an `addItem` function
- A brief `DESIGN_NOTES.md` explaining the session token storage decision and the UI update strategy used

You may stub out the database layer and API calls. Focus on the session management logic and the React state management pattern.
