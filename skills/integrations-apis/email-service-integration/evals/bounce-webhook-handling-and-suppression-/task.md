# Email Deliverability and Suppression System

## Problem/Feature Description

A growing e-commerce platform recently onboarded SendGrid for transactional and promotional email. Within weeks, their sender reputation dropped — some addresses that had previously bounced were still receiving emails, and a surge of spam complaints followed a promotional campaign. The deliverability team has been asked to build two things: a webhook endpoint that captures delivery events and maintains a suppression list, and a utility function that checks whether it is safe to email a given address before any send is attempted.

The suppression rules are not symmetric: a user whose mailbox no longer exists should never receive any email, but a user who marked a promotional email as spam should still receive their order receipts and shipping notifications. Your implementation needs to handle this distinction correctly so that neither deliverability nor customer experience is compromised.

## Output Specification

Produce the following files:

- `app/api/webhooks/sendgrid/route.ts` — A Next.js (App Router) POST route handler that processes a JSON array of SendGrid delivery events. It should handle the relevant event types and maintain a suppression list and delivery log. The handler should return an appropriate response on success.
- `lib/email/suppression.ts` — A module that exports a `canSendEmail(email: string, type: 'transactional' | 'marketing'): Promise<boolean>` function. The function checks the suppression list and applies the correct blocking rules depending on the suppression type and the requested email type.
- `README.md` — A short document (bullet points are fine) explaining the suppression rules enforced by `canSendEmail` and which legal requirements apply to marketing emails.

You do not need a running database — use stub/mock DB calls or inline comments to indicate where real persistence would go. Focus on the logic and structure of the implementation.
