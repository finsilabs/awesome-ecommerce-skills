# Postmark Email Integration for New E-Commerce Platform

## Problem/Feature Description

A new direct-to-consumer brand is launching their online store and needs to set up their entire email infrastructure from scratch. They plan to send both transactional emails (order confirmations, shipping updates, password resets) and occasional promotional campaigns to opted-in customers. After researching providers, the team has chosen Postmark because of its reputation for transactional deliverability and dedicated IP pools.

The tech lead has asked you to build the email sending layer in TypeScript and produce a DNS setup guide for the domain administrator. The guide needs to cover everything required to achieve inbox delivery. The code should support both direct message sending and Postmark's managed template system (which the design team will use to maintain brand consistency). A key architectural concern: the marketing team's campaign activity should never be able to damage the reputation of the transactional sending pipeline, so the sending configuration must enforce this isolation.

## Output Specification

Produce the following files:

- `lib/email/postmark.ts` — A TypeScript module exporting at least:
  - A function for sending a transactional email directly (with HTML and text body)
  - A function for sending a marketing/promotional email directly
  - A function for sending via Postmark's managed template system
- `dns-setup.md` — A DNS configuration guide for the domain administrator covering the records needed for email deliverability, including any recommended progression for policy configuration.
- `package.json` — Listing the required dependencies.

You do not need a running Postmark account — use environment variable placeholders for credentials. Focus on the structure and correctness of the implementation.
