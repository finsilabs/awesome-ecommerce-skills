# Shopper Behavior Tracking Module

## Problem/Feature Description

Finley's, a mid-size online home goods retailer, wants to move toward data-driven personalization. The engineering team has been asked to build the foundational event tracking layer that will power a future recommendation engine. Right now the store has no behavioral data collection at all — every visit is anonymous and no signals are captured. Before any ML model can be trained or any recommendation served, the team needs a robust event pipeline that can record what shoppers do and build per-user profiles from those interactions.

The product manager has specified that the system must handle both logged-in customers and anonymous browsers, since many shoppers browse for weeks before creating an account. The profiles need to capture two key signals: what products a shopper has recently looked at, and which product categories they gravitate toward. These profiles will be consumed by other services, so they must be stored in Redis and expire naturally to avoid storing stale data forever.

## Output Specification

Produce a TypeScript module at `src/events/track.ts` that:
- Defines the event data structure for behavioral tracking
- Implements a function to record events to an event store and update the user profile
- Implements profile update logic that maintains recent product views and per-category affinity scores

Also produce a brief `design-notes.md` file documenting:
- How the module handles anonymous vs logged-in users
- What the profile data structure looks like in Redis
- The data retention policy (TTL)
- How category affinity weights are assigned for different event types

The TypeScript code should be complete and well-typed, using Redis as the profile store. You may stub out the `eventStore` and `redis` dependencies with type-compatible interfaces rather than implementing them.
