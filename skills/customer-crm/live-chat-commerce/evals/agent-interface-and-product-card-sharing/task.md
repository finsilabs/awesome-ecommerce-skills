# Agent Workspace and Product Sharing for BrightCart Chat

## Problem/Feature Description

BrightCart is integrating a live chat feature where customer support agents handle shopping queries in real time. The agents need a rich workspace that shows them the customer's current situation — what's in their cart, recent orders, and what products they've been looking at — so they can give personalized help without asking repetitive questions. Agents also need to be able to push product recommendations directly into the customer's chat window as interactive cards that the customer can act on immediately.

A critical operational concern has come up: agents at BrightCart frequently have too many simultaneous conversations open, leading to slower response times and frustrated customers. The system should enforce sensible limits. Additionally, the customer-facing chat must work correctly across multiple pages of the store, since customers navigate around while chatting. The team has also flagged a bug report: cart data shown to agents goes stale mid-conversation because it's loaded once at the start; it needs to stay current.

## Output Specification

Implement the server-side agent API and the customer-side React component in TypeScript. Produce the following files:

- `src/agent-context-api.ts` — the REST endpoint that returns conversation context for an agent, including customer info, cart state, order history, and browsing activity
- `src/agent-product-search.ts` — the REST endpoint that lets agents search the product catalog by keyword
- `src/components/ProductCard.tsx` — the React component that renders a product card inside the customer's chat window when an agent shares one
- `design-notes.md` — a short document explaining your decisions around data freshness, conversation load limits, and chat widget persistence across page navigation

You may use stub/mock calls (e.g. `db.carts.findActiveByCustomer(...)`) where database access would occur. No real database connection is needed.
