# Carrier Webhook Receiver Service

## Problem/Feature Description

A mid-size e-commerce company has recently contracted with EasyPost to handle multi-carrier shipping across their order management platform. The engineering team needs to integrate EasyPost's webhook feed to receive real-time tracking status events as packages move through carrier networks. Currently, the backend team polls carrier APIs on a schedule, which causes rate-limit errors during peak shipping seasons and means customers sometimes see stale tracking data for hours.

The team wants a new Express.js webhook endpoint that receives events from EasyPost, validates their authenticity, and hands them off for background processing. The endpoint will live alongside other existing routes in a Node.js/TypeScript backend and needs to be robust enough to handle high-volume traffic without dropping events.

## Output Specification

Produce a TypeScript file `webhook-handler.ts` that implements an Express route handler for POST `/webhooks/easypost`. The implementation should:

- Correctly handle raw body parsing for signature verification
- Validate the incoming request's authenticity
- Filter to only relevant event types
- Return a response immediately and defer processing to a queue
- Include a stub `processTrackerEvent` function and a `queue` stub (can be a simple object with an `add` method) so the code is self-contained and reviewable

Also produce a short `implementation-notes.md` explaining the key design decisions made in the implementation, particularly around security and reliability.
