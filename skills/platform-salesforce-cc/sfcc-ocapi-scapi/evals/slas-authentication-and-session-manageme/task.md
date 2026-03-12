# Headless Storefront Authentication Service

## Problem/Feature Description

A fashion retailer is launching a new headless storefront built on Salesforce B2C Commerce Cloud. The team has an existing Salesforce Commerce Cloud org and needs a backend authentication service that handles the full customer journey: anonymous browsing, customer login, and persistent shopping carts.

The current prototype allows customers to browse products and add items to a cart, but loses the cart contents when a guest user logs in. The product team wants a seamless "login and keep my cart" experience. Additionally, the security team has flagged that the current prototype stores session tokens in localStorage, which is a vulnerability — they want tokens stored securely so they are not accessible to third-party JavaScript on the page. The engineering team also noticed that customers are intermittently logged out mid-session and suspects the authentication tokens are expiring without being refreshed.

Your task is to implement a TypeScript authentication module (`lib/sfcc-auth.ts`) and a Next.js API route (`pages/api/auth/`) that implements the complete authentication layer described above. Include a brief `AUTH_DESIGN.md` documenting the security choices made.

## Output Specification

Produce the following files:

- `lib/sfcc-auth.ts` — Core authentication functions covering:
  - Guest session initiation
  - Token refresh
  - Customer login with cart continuity
- `pages/api/auth/session.ts` — Next.js API route that handles session management and authenticated commerce requests on behalf of the client
- `AUTH_DESIGN.md` — A short document (bullet points are fine) explaining the token storage strategy and token lifecycle management approach

Use TypeScript. Assume the following environment variables are available at runtime (do not hardcode their values):
- `SFCC_SHORT_CODE` — the Commerce Cloud short code
- `SFCC_ORG_ID` — the org ID
- `SFCC_SITE_ID` — the site/channel ID
- `SFCC_SLAS_CLIENT_ID` — the SLAS public client ID
- `SFCC_SLAS_REDIRECT_URI` — the registered redirect URI
