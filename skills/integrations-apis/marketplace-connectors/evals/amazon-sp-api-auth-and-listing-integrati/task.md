# Amazon SP-API Integration Module

## Problem/Feature Description

A growing outdoor equipment retailer currently manages their Amazon presence manually through Seller Central. The catalog team updates prices and quantities by hand, which takes hours each day and causes frequent stockouts and pricing errors. The engineering team has been asked to automate their Amazon channel by building a TypeScript integration library that handles authentication, product listing management, and inventory updates.

The Amazon Selling Partner API (SP-API) requires a specific authentication flow that differs from typical REST APIs. Your task is to implement the core integration modules so the team can start automating their Amazon catalog operations. The integration needs to handle token lifecycle management efficiently and make properly authenticated API calls for listing creation and inventory adjustments.

## Output Specification

Produce a TypeScript project with the following structure:

- `src/amazon/auth.ts` — Authentication module handling token retrieval and signed API calls
- `src/amazon/listings.ts` — Module for creating/updating product listings and updating inventory quantities
- `package.json` — Package manifest with required dependencies listed

Write a brief `IMPLEMENTATION_NOTES.md` summarizing the key design decisions you made, including which packages you chose for authentication and why.

Do not actually call the Amazon API — use environment variable references for credentials (e.g., `process.env.AMAZON_REFRESH_TOKEN`) but implement the full logic as if it would be wired up to real credentials.
