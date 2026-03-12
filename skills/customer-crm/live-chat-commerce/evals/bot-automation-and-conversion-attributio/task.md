# Chat Automation and Revenue Attribution for NovaMart

## Problem/Feature Description

NovaMart's support team is overwhelmed with repetitive order status queries that currently consume a significant portion of agent time. The operations team wants an automated bot layer that intercepts these common questions and responds instantly, routing only complex issues to human agents. The bot needs to handle both explicit order number lookups and natural language questions about order whereabouts.

At the same time, NovaMart's leadership wants to understand the ROI of their live chat investment. There's currently no way to tell which sales were influenced by a chat session, so the marketing and ops teams can't demonstrate the value of the chat team or reward agents who contribute to conversions. The system needs to track which completed orders followed a recent chat conversation, credit the responsible agent, and capture the data needed for performance reporting.

## Output Specification

Implement the automation and attribution logic in TypeScript. Produce the following files:

- `src/bot-handler.ts` — the bot auto-response function that detects and handles order status queries
- `src/attribution.ts` — the function that runs when an order is placed and records conversion attribution
- `src/analytics.ts` — a module that includes logic to track and surface agent first-response time, including any alerting mechanism when thresholds are exceeded
- `design-notes.md` — a brief document explaining your detection logic for order queries, how the bot integrates with human agent routing, and your attribution window choice

You may use stub/mock calls (e.g. `db.orders.findByNumber(...)`) where database access would occur. No real database connection is needed.
