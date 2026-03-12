# Analytics Consent Module for EU-Facing Store

## Problem/Feature Description

ShopNorth is a mid-sized outdoor gear retailer that recently expanded into Germany and France. Their Next.js storefront already uses Google Analytics 4 for conversion tracking, but their legal counsel has flagged that loading GA4 without user consent violates EU data protection law. The analytics team also uses Google Ads for retargeting, and both tools need to be gated behind proper consent.

The store's engineering team needs a consent management module that controls when GA4 and Google Ads tracking are active. The module must handle situations where the site is rendered on the server (Next.js SSR) without breaking. It also needs to handle returning visitors correctly — if the consent notice wording is ever updated, existing stored consent must be invalidated so users are shown the updated banner again.

## Output Specification

Produce a self-contained TypeScript implementation of the consent system. Write the following files:

- `lib/consent.ts` — the consent state type, storage/retrieval logic, and the function that activates tracking tools based on stored choices
- `components/CookieBanner.tsx` — a React component that shows the consent UI with at minimum "Accept all" and "Reject all" options, plus granular controls when expanded
- `pages/api/consent.ts` — a Next.js API route that accepts a POST request to persist the user's consent server-side
- `INTEGRATION.md` — a short explanation of how to add the GA4 script tag to `_document.tsx` or `layout.tsx` so that analytics loads in a privacy-safe way, including the relevant script snippet

Do not include any real GA Measurement IDs or API keys in your output; use placeholder values.
