# Inbound SMS Handler and Transactional Notifications

## Problem/Feature Description

A furniture e-commerce company has set up a Twilio number for SMS marketing but customers have started texting back with a variety of responses — some trying to opt out, some asking for help, and some with general questions. Carrier guidelines require the company to handle certain keywords automatically and consistently or risk having their messages filtered. The customer support manager also wants to make sure that general replies don't get lost.

Separately, the operations team wants to send shipping confirmation texts to customers who haven't opted into marketing — they assume that since it's operational information and not a promotion, the same rules don't apply. The engineering team needs to implement both pieces correctly: a webhook that handles inbound messages according to carrier requirements, and a transactional notification sender that plays by its own distinct rules.

## Output Specification

Produce the following TypeScript source files:

- `inboundWebhook.ts` — An Express-style POST handler (`/api/sms/inbound`) that processes inbound messages from Twilio's webhook. You can mock `db`, `supportQueue`, and `process.env` values.
- `transactionalSms.ts` — A function that sends a shipping notification SMS, using a mock `db` and Twilio client.
- `README.md` — A short explanation (1–2 paragraphs) of how inbound keyword handling works and how the transactional consent model differs from marketing consent.

Use TypeScript. No real database or Twilio connection is needed — mock the external dependencies.
