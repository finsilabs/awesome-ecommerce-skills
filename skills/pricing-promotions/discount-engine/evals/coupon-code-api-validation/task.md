# Coupon Code Redemption API Endpoint

## Problem/Feature Description

A B2C subscription platform is adding coupon code support to their checkout flow. Customer support has complained that the current checkout silently fails when an invalid code is entered, leaving customers confused about why their discount wasn't applied. Additionally, the growth team recently discovered that a promotional code intended for new customers was used repeatedly by existing customers, and that during a high-traffic sale, the same limited-use code was redeemed more times than allowed because of a race condition.

The team needs a well-structured REST API endpoint (`POST /api/cart/discount`) that validates and applies a coupon code entered by a customer. The endpoint must give customers clear, differentiated feedback for every failure mode, enforce usage limits safely, and be implemented so that discounts are always calculated server-side. It must also re-validate any previously applied discounts whenever a new code is submitted.

## Output Specification

Produce the following files in your working directory:

1. `apply-discount.ts` — The Express (or framework-agnostic) request handler implementing the coupon redemption endpoint. Include any supporting functions (condition checking, usage counting, etc.) in the same file or clearly imported modules.
2. `apply-discount.test.ts` — Tests (using any framework or plain assertions) covering: (a) code not found, (b) expired code, (c) usage limit reached, (d) per-customer limit reached, (e) cart does not meet conditions, and (f) a successful application.
3. `api-spec.md` — Documents the endpoint contract: request shape, all possible response codes with their meanings, and the order in which validation steps are performed.
