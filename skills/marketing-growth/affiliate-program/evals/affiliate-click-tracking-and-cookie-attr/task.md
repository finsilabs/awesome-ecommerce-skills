# Affiliate Link Click Tracker

## Problem/Feature Description

GreenLeaf Supply, an online retailer of sustainable home goods, is launching an affiliate program to partner with eco-lifestyle bloggers. Affiliates will share unique links to the store; when visitors arrive via those links, the store needs to record the visit, tag the browser for future attribution, and then redirect the visitor to the destination page seamlessly.

The engineering team needs a TypeScript HTTP request handler — suitable for an Express-style server — that processes incoming affiliate link clicks. Each affiliate has a pre-assigned code (e.g. `"A3F9C2"`) included as a query parameter. The handler must look up the affiliate, record the click event for analytics and fraud investigation purposes, attach an attribution cookie to the visitor's browser, and redirect them onward. The system must also include a utility function for generating new affiliate codes from scratch when onboarding new affiliates.

Your implementation will be reviewed by the security team, who care deeply about how cookies are configured and what data is captured. The analytics team also needs complete click records to investigate disputes later.

## Output Specification

Produce a single TypeScript file `affiliate-tracker.ts` containing:

- A `generateAffiliateCode()` function that returns a new unique affiliate code string
- A `trackAffiliateClick(req, res)` Express-style route handler that processes an incoming click

Include TypeScript interfaces/types as needed. You do not need to implement the database layer — use a `db` object assumed to be in scope. Assume `Request` and `Response` types from Express are available.

Also produce a short `design-notes.md` explaining the key design decisions made (cookie configuration, click data recorded, code format chosen, attribution model).
