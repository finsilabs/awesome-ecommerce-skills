# Automated Retention Intervention Workflows

## Problem/Feature Description

UrbanKit is an online streetwear retailer whose marketing team runs several email campaigns manually today. Each week a team member exports a list of lapsed customers and sends them a bulk discount code. The problem: customers who just bought yesterday sometimes receive the email anyway, high-value customers are getting the same 20%-off code as occasional buyers (which has started to erode gross margin), and some customers are getting retention emails on top of a newsletter plus a flash sale notification in the same day.

The engineering team has been asked to replace this manual process with an automated workflow system. The new system should automatically classify customers into risk tiers and dispatch the appropriate intervention — with guardrails to prevent over-contacting customers or sending unnecessary discounts to people who are likely to repurchase on their own.

The team wants the system to run once per day at a specific time and handle at least three distinct intervention types: early-warning customers who are just beginning to slip, high-value customers who are truly at risk, and first-time buyers approaching their expected repurchase window.

## Output Specification

Produce a TypeScript file `retention-workflows.ts` that implements the automated workflow runner described above. Use stub/mock implementations for database calls and email sending — the logic and guard conditions are what matter.

Also produce a `WORKFLOW_NOTES.md` that documents:
1. When each workflow fires and for whom
2. What each intervention sends (content/parameters)
3. How duplicate sends are prevented for each workflow type
4. How frequently a customer can be contacted (across all workflows)
5. When a pending retention job should be cancelled
