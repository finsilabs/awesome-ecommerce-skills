# Magento Headless Storefront: Core API Client

## Problem Description

A fashion retailer is rebuilding their online store as a Next.js headless application backed by Magento 2. The backend Magento instance serves multiple regional storefronts (UK, DE, US) that have different currencies and pricing, so every API request must clearly identify which storefront it is targeting. The team wants public catalog pages to benefit from Next.js incremental static regeneration so pages automatically refresh without a full rebuild.

The retailer's security team conducted a review of the previous prototype and raised concerns about how authentication tokens were stored on the client side. The new implementation must address these concerns and follow current web security best practices for token storage.

## Output Specification

Implement a TypeScript Magento GraphQL client module in a file named `lib/magento-client.ts`. It should export at minimum:

- A generic query/mutation function that handles all communication with the Magento GraphQL endpoint
- A customer login function that authenticates with email and password and stores the token securely
- A function (or middleware) that demonstrates how to make an authenticated request using the stored token

Also produce a short `NOTES.md` file (max 20 lines) that explains:
- How the store view targeting works
- How authentication tokens are stored and why
- How GraphQL error responses are handled

The implementation should be TypeScript and work within a Next.js App Router project. Use environment variables for the Magento URL and store code. Do not make live network calls — the code only needs to be structurally correct and runnable.
