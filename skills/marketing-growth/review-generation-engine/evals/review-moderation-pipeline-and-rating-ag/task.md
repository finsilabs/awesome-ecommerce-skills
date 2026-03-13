# Review Moderation and Rating Aggregation System

## Problem/Feature Description

An e-commerce platform has been accumulating reviews in a `pending` queue and needs a backend pipeline to automatically moderate them and update product ratings. The site has been targeted by waves of fake positive reviews — several products have been flooded with suspicious 5-star entries from a small set of IP addresses, and others show unusual bursts of activity from single accounts. The team has also noticed some reviews that are too short to be useful, contain nonsense characters, or awkwardly disclose that the reviewer received a benefit. They want a defensible, auditable moderation layer rather than relying entirely on manual review.

After moderation, approved reviews should be reflected in the product's star rating immediately, and the product page served from the CDN should be refreshed to show the latest rating. For reviews that include photos, an incentive (discount code) should be sent to the reviewer after approval.

## Output Specification

Implement the following in a file named `moderation.ts` (TypeScript):

- A `moderateReview(reviewId: string)` function that inspects a single review and returns a moderation decision
- A `processReviewModeration()` function that processes all pending reviews
- A `refreshProductRatingAggregate(productId: string)` function that updates the product's aggregate rating

Also write a `MODERATION_RULES.md` file documenting each flag your system can raise, the condition that triggers it, and the decision logic that maps flags to outcomes.

You may assume these imports are available: `db` (ORM), `subHours`, `subDays` (date-fns), `checkProfanity`, `createUniqueDiscount`, `sendReviewThankYouEmail`, `refreshProductRatingAggregate`, and `invalidateProductCache`. Do not implement those imported functions.
