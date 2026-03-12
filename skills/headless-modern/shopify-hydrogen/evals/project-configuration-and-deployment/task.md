# Configure a Hydrogen Storefront and Set Up Deployment

## Problem/Feature Description

A home goods brand has hired a development agency to build their new headless Shopify storefront. The agency needs to set up the complete project from scratch: scaffold the app, wire up the Storefront API, build a homepage that showcases featured collections, and prepare the project for production deployment on Shopify's edge infrastructure. The brand operates in multiple markets (US, UK, AU) and wants to make sure the architecture supports international pricing from the start.

The homepage should load featured collections quickly — performance is a top priority since the brand has measured that every 100ms of load time costs them conversion rate. At the same time, personalized "Recently Viewed" product recommendations for logged-in customers should load without blocking the main page content. The deployment pipeline should use GitHub Actions so that every push to main automatically deploys to production.

## Output Specification

Produce the following files representing key parts of the project setup:

1. `.env.example` — Template environment file with all required Storefront API configuration variables (with placeholder values, not real credentials).

2. `server.ts` — The Hydrogen entry point file that initializes the Hydrogen context using the environment variables, including both public and private storefront tokens and session configuration.

3. `app/routes/_index.tsx` — Homepage loader and component that fetches featured collections. The loader should optimize for fast initial page load while ensuring personalized "Recently Viewed" recommendations don't block rendering. Include a GraphQL query that requests localized data for international markets.

4. `.github/workflows/oxygen.yml` — GitHub Actions workflow file for deploying to Oxygen on push to main.

5. `SETUP_NOTES.md` — Notes explaining the caching strategy decisions, how environment variables are managed across different environments (local development and production), and how API version compatibility is maintained over time.
