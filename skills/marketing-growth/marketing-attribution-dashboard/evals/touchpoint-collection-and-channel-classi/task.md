# Marketing Touchpoint Collection Middleware

## Problem/Feature Description

A mid-size apparel brand runs ads on Meta, Google, and TikTok, sends campaigns through Klaviyo, and also gets significant organic search and direct traffic. They have had a persistent headache: their client-side analytics have been silently losing data due to ad blockers, browser privacy restrictions, and iOS tracking changes. The data engineering team estimates that up to 35% of paid sessions are going untracked.

The solution agreed upon is to move all touchpoint collection to the server side. An Express.js API already handles all page requests and checkout events. The team needs a middleware function that intercepts each request and writes a touchpoint record to the database. The middleware must correctly classify what channel drove each visit, handle both new and returning visitors, and ensure session boundaries are respected. A separate concern is identity resolution: once a customer checks out and is identified, all the pre-login anonymous touchpoints in that session should be linked to their customer record so the attribution model has a complete journey.

## Output Specification

Implement the server-side touchpoint tracking middleware as a TypeScript module. Write the code to `touchpoint-middleware.ts`.

The file should include:
1. A `trackTouchpoint` Express middleware function that records touchpoints to the database.
2. A `classifyChannel` function that categorises a visit based on UTM parameters and the HTTP referrer.
3. A `stitchCustomerTouchpoints` function (or equivalent) that links pre-login anonymous touchpoints to a customer ID after login/checkout.

Also write a `channel-classification-tests.ts` file that tests the `classifyChannel` function with at least 8 different input scenarios (covering various UTM combinations and referrer values), prints the input and expected vs. actual output for each test case, and exits with a non-zero code if any test fails. Run the tests with `npx ts-node channel-classification-tests.ts` and save the output to `classification-test-output.txt`.

You may stub out the actual database calls (e.g. `db.touchpoints.create`) and cookie/session utilities as needed — focus on the logic.
