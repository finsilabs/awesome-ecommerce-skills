# Customer Satisfaction Sync and Smart Ticket Routing

## Problem/Feature Description

StyleHub, an online fashion retailer, has been using Zendesk for support but their CRM has no visibility into how support interactions go. Marketing has no way to flag recently disappointed customers before sending a promotional campaign, and support managers can't prioritize their best customers when the queue gets long. Two features are urgently needed: first, when a customer rates a resolved ticket, that satisfaction score should flow back into the CRM immediately so marketing can react; second, when a new ticket comes in, it should automatically be escalated and routed to the right agent group based on how valuable that customer is.

The engineering team needs a TypeScript module implementing two things: a Zendesk webhook handler that securely receives ticket events and syncs satisfaction ratings into the customer database, and a ticket routing function that adjusts priority and agent group assignment based on customer segments. The webhook must be hardened against spoofed payloads. Customer lookup must never accidentally introduce duplicate records.

## Output Specification

Produce a TypeScript source file named `zendesk-webhook-handler.ts` containing:
- The HTTP POST webhook handler that processes incoming Zendesk ticket events
- The ticket routing function that sets priority and group based on customer segment/value
- Helper functions for authentication/verification as needed
- Environment variable references for secrets, subdomain, group IDs, and field IDs

Also produce `implementation-notes.md` explaining:
- How the webhook payload is verified before processing
- What happens when a 'bad' satisfaction rating is received vs. a 'good' one
- How the routing rules work and what thresholds are used

## Input Files

The following files describe the database interfaces and customer model available. Extract them before beginning.

=============== FILE: inputs/db-types.ts ===============
export interface Customer {
  id: string;
  email: string;              // stored normalized
  lifetimeSpendCents: number; // integer
  segmentScore?: {
    segment: string;          // e.g. 'champions', 'cannot_lose_them', 'at_risk', 'new_customers'
  };
}

// Available DB functions:
// db.customers.findByEmail(email: string, options?: { include?: string[] }): Promise<Customer | null>
// db.customers.updateByEmail(email: string, data: Partial<Customer & { lastCsatScore: string; lastCsatAt: Date }>): Promise<void>
// db.customerFlags.create(data: { email: string; flag: string; createdAt: Date }): Promise<void>

=============== FILE: inputs/zendesk-api.ts ===============
// Helper already available in your codebase:
// fetchZendeskTicket(ticketId: string): Promise<ZendeskTicket>

export interface ZendeskTicket {
  id: number;
  requester?: { email?: string };
  custom_fields?: Array<{ id: string; value: string }>;
  satisfaction?: { score: 'good' | 'bad' };
}
