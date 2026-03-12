# Order Confirmation Email Module

## Problem/Feature Description

A mid-sized online retailer is rebuilding their post-purchase communication flow. Currently they send plain HTML emails directly from their backend, which are frequently flagged as spam and look broken in Outlook and mobile clients. The engineering team has decided to adopt a dedicated transactional email provider and a React-based template system so that the marketing and engineering teams can iterate on email designs independently from the send logic.

Your task is to build the order confirmation email module. This includes a reusable React email template component and the TypeScript send function that renders and delivers it via SendGrid. The module should be production-ready: it must work correctly the first time an order triggers it and never accidentally send the same confirmation twice, even under retry conditions.

## Output Specification

Produce the following files in your working directory:

- `emails/order-confirmation.tsx` — A React Email template component for order confirmations. It should accept order data as props and render a complete, styled email showing the order number, customer name, ordered items (with product name, quantity, and price), and order total.
- `lib/email/sendgrid.ts` — A TypeScript module that exports a `sendEmail` function using SendGrid.
- `lib/email/send-order-confirmation.ts` — A TypeScript module that renders the template and calls `sendEmail`, including a guard against sending duplicate confirmation emails for the same order.
- `package.json` — Listing all required dependencies.

You do not need to set up a real database or API key — use stubs or comments where actual DB/API calls would go. Focus on the structure and implementation approach, not running the code end-to-end.
