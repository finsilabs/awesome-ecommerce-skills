# SMS Marketing Opt-In System for Multi-Region E-Commerce

## Problem/Feature Description

A mid-sized online retailer is expanding its SMS marketing program to customers in the United States, Canada, and the European Union. The legal team has flagged that the current approach — a simple checkbox at checkout with no audit trail — creates significant regulatory exposure. In the US, the TCPA imposes statutory damages of $500–$1,500 per unsolicited message; in the EU, GDPR violations can reach 4% of annual revenue. The company needs a compliant opt-in and opt-out system before it can proceed with any SMS campaigns.

The engineering team needs to build two things: a checkout opt-in widget and an inbound SMS handler. The opt-in widget must collect and persist consent in a way that can be produced as evidence in a compliance audit. The inbound handler must process messages customers send back (like STOP or HELP) and return the required responses. The legal team has specified that consent records must support an audit trail that would hold up in court, and the system must properly handle the special case of EU customers who gave consent a long time ago and have since gone dormant.

## Output Specification

Produce the following files:

- `src/components/SmsOptIn.tsx` — the React opt-in widget for checkout
- `src/db/schema.ts` — TypeScript interface(s) defining the consent data model
- `src/handlers/inboundSms.ts` — the inbound SMS webhook handler
- `src/lib/consentUtils.ts` — utility functions for checking whether a contact's consent is still valid
- `IMPLEMENTATION_NOTES.md` — a brief document describing the consent retention policy (how long records are kept and what fields are captured)

All TypeScript files should be syntactically valid and importable (no runtime execution needed).
