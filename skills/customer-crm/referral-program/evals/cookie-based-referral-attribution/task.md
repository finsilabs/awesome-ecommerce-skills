# Referral Tracking Middleware

## Problem Description

A mid-sized e-commerce company is launching a refer-a-friend program. The marketing team has noticed that when customers share referral links, they sometimes click the link multiple times across different sessions, or the referral link attribution gets overwritten when a customer clicks an ad the same day. They need a robust Express.js middleware that reliably attributes the original referral visit to a new customer signup, regardless of how many times the link is clicked or which channel the customer ends up converting through.

The engineering team also has concerns about referral links getting posted on deal-sharing forums (like RetailMeNot or Reddit), which could result in the same IP address making hundreds of clicks — none of which are genuine referrals. The middleware should detect and block this kind of abuse at the click-logging layer.

## Output Specification

Implement the referral tracking middleware in a file called `referral-middleware.ts` (TypeScript). The middleware should:

- Capture referral codes from incoming requests and persist them for later attribution
- Track click events with enough metadata for fraud analysis
- Protect against high-volume clicks from the same IP address (rate limiting)

Also produce a `referral-attribution.ts` file that shows how a new customer signup reads the stored referral code and creates the pending referral record.

Both files should be standalone TypeScript modules with type annotations. You do not need to connect to a real database — use stub/interface definitions for `db` so the logic is clear.
