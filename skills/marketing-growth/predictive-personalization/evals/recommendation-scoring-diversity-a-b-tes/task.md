# Personalized Recommendations API

## Problem/Feature Description

NovaSport, an online sporting goods retailer, has recently launched a recommendation initiative. Their data team has already precomputed product similarity matrices (stored in Redis under `similar:{productId}`) and maintains live user profiles in Redis (`user-profile:{key}`) with `recentViews` (JSON array of `{productId, ts}`) and `categoryScores` (JSON object of category affinity). There is also a Redis sorted set `popular-products` and sets `category-products:{categoryId}` used for fallback. Anonymous users use the key `anon:{sessionId}`.

The engineering team now needs to build the recommendation serving layer — a function that takes a user context and returns a ranked list of product IDs to display. The function must work across different page contexts (homepage, product detail page, cart page), serve fresh personalized results quickly from precomputed data, and degrade gracefully when user history is sparse. The team is also cautious about rolling this out broadly and wants to measure actual business impact before fully committing.

Additionally, the team has noticed that early recommendation prototypes tended to show 10 similar running shoes when a runner visited — they want recommendations to feel broad and surprising, not just "more of the same." They also want to ensure compliance with privacy regulations as they expand to European markets.

## Output Specification

Produce the following TypeScript files:

1. `src/api/recommendations.ts` — the main recommendation function that returns ranked product IDs, supporting homepage, PDP, and cart contexts

2. `src/middleware/experiment.ts` — an experiment assignment module that determines which variant a user should receive

3. `src/privacy/opt-out.ts` — a module that handles user opt-out and data deletion requests

4. `design-notes.md` documenting:
   - How multiple recommendation signals are combined and weighted
   - How diversity is enforced in the final result set
   - How cold-start users are handled
   - How the experiment is structured and what metrics should be tracked before graduation
   - Privacy compliance mechanisms

You may stub out the Redis client. The code should be complete and illustrate the full serving and experiment assignment logic.
