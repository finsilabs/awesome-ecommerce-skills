# Customer Right-to-Erasure Implementation

## Problem/Feature Description

Your company's data protection officer has received an uptick in GDPR "right to erasure" (Article 17) requests from customers asking to have their accounts deleted. The current process is entirely manual: someone on the team finds the customer in the database and deletes their profile row, but this often misses data in the search index, email marketing platform, analytics warehouse, and CDN-cached pages. Auditors flagged this as a gap because there is no evidence the deletions were actually completed across all systems.

The engineering team needs to build a TypeScript function `purgeCustomerData` that handles the full deletion workflow for a single customer. The function must be resilient: if it is interrupted halfway through (e.g. the analytics API times out), it should be possible to tell which systems were already cleaned and which still need work. The function also needs to handle edge cases — for example, a customer who has an unresolved chargeback dispute cannot be legally deleted yet.

Additionally, the team needs a lightweight mechanism to track incoming erasure requests so that nothing falls through the cracks past the statutory deadline.

## Output Specification

Produce a TypeScript file `lib/data-retention/purge-customer.ts` that implements:

- `purgeCustomerData(customerId: string, reason: string)` — the main purge function
- Any helper interfaces or stub service clients needed

Also produce a short `DESIGN.md` explaining:
- How partial failures are handled (what state is recorded)
- How the legal hold check works
- What the 30-day deadline tracking mechanism looks like (data model or pseudocode is fine)
