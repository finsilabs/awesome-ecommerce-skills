# Chargeback Dispute Ingestion System

## Problem/Feature Description

FinPay is a growing payment facilitator that processes transactions for several hundred small e-commerce merchants. The ops team has been tracking chargebacks manually in spreadsheets, and they are regularly missing response deadlines because disputes come in from different card networks (Visa, Mastercard, Amex, Discover) with different response windows. A dispute from a Discover cardholder has different urgency than one from an Amex cardholder, and mixing them in a spreadsheet has already cost the company several uncontested losses.

The engineering team has been asked to build the foundation of a proper chargeback management system. The first milestone is: (1) a database schema that captures all the information needed to manage disputes through their lifecycle, and (2) a Stripe webhook handler that ingests new disputes automatically, calculates the correct response deadline based on the card network and dispute reason, links the dispute back to the original order via Stripe charge metadata, and initiates automated evidence collection and win-probability scoring.

## Output Specification

Produce the following files in your working directory:

- `schema.sql` — PostgreSQL DDL for the chargeback-related tables and indexes needed to support the full dispute lifecycle.
- `webhook-handler.js` — A JavaScript/Node.js module that handles incoming Stripe dispute webhooks. It should process the relevant dispute event types, calculate the correct response due date, persist the new chargeback record, run evidence collection and scoring, and route the dispute appropriately based on the resulting score and time remaining.
- `design-notes.md` — A short document (bullet points are fine) explaining your key design decisions: which Stripe webhook event types you handle, how you determine the response deadline per network, how metadata is used to link disputes to orders, and any assumptions made.
