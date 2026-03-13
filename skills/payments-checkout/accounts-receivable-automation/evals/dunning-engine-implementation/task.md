# Automated Invoice Follow-Up System

## Problem/Feature Description

A B2B software company bills its clients on net-30 and net-60 terms. Historically, a billing admin would manually check a spreadsheet each morning and send follow-up emails to overdue accounts. As the client base has grown to 200 accounts, this process is no longer scalable — invoices are falling through the cracks and the company's average collection time has crept up significantly.

The engineering team needs to automate the follow-up process entirely. The system already has an invoices table and a dunning_sequences table (with a `steps` JSONB column holding an array of `{step_number, days_overdue, action, template_id}` objects). The automation should process overdue invoices once per day, advance each invoice through the appropriate escalation step, and when accounts become seriously delinquent, put them on credit hold automatically.

The company also caters to a small number of enterprise clients worth $500K+ annually — the team wants those accounts handled differently from small clients.

## Output Specification

Produce a JavaScript module `dunning.js` that implements the daily dunning processor. The file should be self-contained and use JSDoc comments to document the key functions.

Also produce a `dunning_config.json` file containing the default dunning sequence configuration that should be seeded into the database.

Include a `dunning_notes.md` that explains:
- How the system decides which step to execute for a given overdue invoice
- How credit hold escalation is triggered and what it sets on the customer record
- How the system handles high-value vs. standard accounts differently
