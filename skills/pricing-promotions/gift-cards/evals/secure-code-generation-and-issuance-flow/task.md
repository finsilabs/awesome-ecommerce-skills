# Gift Card Issuance Service for PetStuff Online

## Problem Description

PetStuff Online is a direct-to-consumer pet supply store that has just approved a gift card feature for Q4. When a customer purchases a gift card, the platform needs to: generate a unique code for the card, persist it to the database, and automatically send the recipient an email so they can use it.

The engineering lead has flagged a concern from a past incident at another company: gift card codes ended up in server access logs because they were passed as URL path parameters, exposing customer credit to anyone with log access. The new implementation should be designed with this in mind. The team also wants codes to be practical for customers to use — cards may be printed, shown on screens, or read aloud during customer support calls.

The store's database already has a `gift_cards` table and a `gift_card_transactions` ledger table (similar to a double-entry bookkeeping approach). Your task is to implement the TypeScript service function that handles card issuance end-to-end: generating the code, writing to the database, and dispatching the notification email.

Assume the following are available as imports:
- `db` — a database client with `.transaction()`, `.giftCards.insert()`, and `.giftCardTransactions.insert()` methods
- `emailService` — an email client with `.send({ to, template, data })` method
- `crypto` from Node.js standard library

## Output Specification

Write a TypeScript file named `issueGiftCard.ts` containing:
1. The `generateGiftCardCode()` function
2. The `issueGiftCard(params)` function that creates the card, records the ledger entry, and sends the email

The file should be self-contained and runnable. Include the type definitions for any interfaces used.
