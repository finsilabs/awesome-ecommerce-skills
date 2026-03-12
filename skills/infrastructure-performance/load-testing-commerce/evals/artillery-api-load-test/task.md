# Product Launch Stress Test: Artillery Configuration for Commerce API

## Problem/Feature Description

Rova, a direct-to-consumer electronics brand, is launching a limited-edition product drop that is expected to attract a surge of simultaneous buyers. Their backend is a REST API that handles catalog browsing, product search, cart operations, and checkout. The ops team wants to validate API stability under both sustained peak load and brief traffic spikes (the kind caused when a social media post goes viral mid-launch). They have chosen Artillery as their load testing tool.

The team needs a complete Artillery load test setup that covers the full commerce flow: browsing the catalog, searching for the product, and completing checkout. The test must handle state across request steps (for example, using a cart ID returned from one API call in the next), generate realistic per-user data without collisions, and simulate the characteristic shape of a product launch traffic curve.

## Output Specification

Produce a complete Artillery load test configuration in `artillery/commerce-load-test.yml` and a supporting processor module at `artillery/processors/commerce-helpers.js`. The configuration should model realistic multi-phase traffic and realistic user flows.

Also write a `test-design-notes.md` explaining: how the scenario weights were chosen, why think time (`think` steps) values were set the way they are, and how the processor generates unique user data per virtual user.
