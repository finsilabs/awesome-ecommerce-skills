# Review Display and Helpfulness Voting for a Product Page

## Problem/Feature Description

A fashion retailer's product pages currently show no customer reviews, and the conversion rate is significantly lower than industry benchmarks. The product team has asked the engineering team to surface customer reviews directly on product pages. The UX designer wants to show the most trustworthy and useful reviews first, with a way for shoppers to signal which reviews they found helpful. The ops team has also flagged that they need a post-purchase flow that asks customers for reviews at the right moment — early enough to be relevant, but late enough that customers have actually received and used the product.

The engineer needs to build: (1) an API endpoint and data layer for fetching reviews for a product page with sensible defaults, (2) a front-end component (or server-rendered HTML template) that displays reviews with appropriate trust indicators, and (3) the "helpful" voting mechanism so shoppers can upvote useful reviews, plus the job that schedules review request emails.

## Output Specification

Produce the following TypeScript files:

1. **`review-api.ts`** — API handlers for:
   - `GET /api/products/:productId/reviews` — returns paginated approved reviews for a product page
   - `POST /api/reviews/:reviewId/helpful` — records that a visitor found a review helpful

2. **`review-widget.ts`** (or `.tsx` if using React/JSX) — A component or template function that renders the review list. It should accept an array of review objects and render them, including any trust-related display elements.

3. **`review-email-trigger.ts`** — The function that schedules a post-purchase review request email job when an order is delivered. Include stub implementations for the queue and email sender.

4. **`demo-output.json`** — A static JSON file showing example API output from `GET /api/products/:productId/reviews` with at least 3 sample reviews (mix of verified and unverified).

Write `package.json` with any required dependencies.
