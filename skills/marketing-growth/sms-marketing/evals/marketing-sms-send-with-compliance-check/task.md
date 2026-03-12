# Promotional SMS Campaign Sender

## Problem/Feature Description

A mid-sized e-commerce retailer wants to run flash sale campaigns via SMS. Their marketing team sends promotions to thousands of subscribers at a time, and they have run into problems in the past: some customers complained they received texts at 6am, a carrier blocked a batch for violating rate limits, and their legal team is concerned about messages sent to customers who had opted out weeks earlier.

The engineering team has been asked to build a reliable, compliant campaign sender that handles all of these edge cases automatically. The system needs to work with Twilio, respect when customers can legally be messaged based on their location, and not overwhelm the carrier. Detailed records of every message sent are required for compliance audits.

## Output Specification

Produce the following TypeScript source files:

- `smsSender.ts` — The core send function that sends a single marketing SMS to a subscriber, plus any helper functions it depends on (timezone handling, phone normalization, etc.)
- `campaignSender.ts` — A function that sends a message to a list of phone numbers (representing a segment), using the send function above
- `README.md` — Documentation covering: the compliance approach taken (delivery timing restrictions, throughput management), and any infrastructure or registration requirements that must be completed before the system can go live

The implementation should use mock objects for the database (`db`) and queue (`smsQueue`) — no real connections are needed.
