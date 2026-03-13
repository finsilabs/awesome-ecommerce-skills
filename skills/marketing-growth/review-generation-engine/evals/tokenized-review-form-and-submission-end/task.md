# Customer Review Submission Endpoint

## Problem/Feature Description

A growing direct-to-consumer brand has recently switched from a third-party review app to a custom-built solution. Their backend is a Node.js/Express API backed by a PostgreSQL database (accessed via a `db` ORM object). Review request emails are already going out with a special link, but clicking that link currently leads to a 404. The engineering team needs to build the review form rendering and submission endpoints from scratch.

A key product requirement is that customers should be able to submit reviews without creating an account or logging in — the review link should carry enough authentication context on its own. The team also wants the system to capture the star rating a customer clicked in the email, so the form feels pre-filled and reduces abandonment. Photo uploads should be encouraged, with an incentive automatically queued for later fulfillment once the review passes quality checks.

## Output Specification

Implement the following in a file named `review-endpoints.ts` (TypeScript, Express handlers):

- A `generateReviewToken(orderId, productId, customerId)` function that returns a signed link token
- A `GET /review/:token` handler (`renderReviewForm`) that verifies the token and renders the form
- A `POST /review/:token` handler (`submitReview`) that validates and saves the review

You may assume the following are available as imports: `jwt` (jsonwebtoken), `db` (ORM with `db.products`, `db.productReviews`, `db.pendingIncentives`), `processReviewPhotos`, `onReviewSubmitted`, and an Express `Request`/`Response` types. Use `process.env.REVIEW_JWT_SECRET` for the JWT secret. Do not implement the actual email sending or photo storage — focus on the endpoint logic.

Also produce a short `NOTES.md` describing the token lifecycle (how it's generated, what it contains, when it expires) and the photo incentive flow.
