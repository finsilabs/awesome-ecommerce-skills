# Year-End Tax Reporting and Reserve Management

## Problem/Feature Description

ArtisanHub is a marketplace for independent craftspeople that has been running for two years. As January approaches, their finance team has two urgent problems. First, they need to file 1099 forms for qualifying sellers — but no one on the team is sure exactly who qualifies under the rules that changed recently, whether the form should report gross sales or just what the seller was paid after fees, and how to handle sellers who never submitted their tax paperwork. Second, the rolling reserve funds held back from early sellers are maturing and need to be released automatically — the current manual process is error-prone and sellers are complaining about delayed access to their money.

The engineering team needs: (1) a JavaScript service that generates 1099 records for the correct set of sellers using the current IRS threshold, and (2) a daily job that finds and releases matured reserve funds. The finance team also wants a monitoring query they can run to quickly see which active sellers are approaching the filing threshold and whether their W-9 status creates any compliance risk.

## Output Specification

Produce the following files:
- `tax-reporting.js` — the 1099 generation service
- `reserve-release-job.js` — the daily reserve release job
- `tax-compliance-notes.md` — explains the threshold used, what amount is reported on the 1099, how W-9 status affects withholding, and the recommended W-9 collection trigger point
- `seller-1099-status.sql` — a SQL query that shows active sellers with their YTD earnings and a status column indicating whether they require a 1099, still need a W-9, or are below threshold
