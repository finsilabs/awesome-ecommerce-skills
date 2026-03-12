# Automated Nightly Data Feed Import for SFCC

## Problem/Feature Description

A retail operations team runs a nightly batch process that generates three export files from their ERP system: a product catalog XML, an inventory levels XML, and a pricebook XML. These files need to be pushed into Salesforce Commerce Cloud each night. Previously, a team member would manually log into Business Manager to upload the files and trigger the import jobs, but this is error-prone and doesn't scale.

The team wants an automated Node.js script that uploads all three XML files to SFCC and triggers the corresponding import jobs. The platform architect wants catalog and inventory processing to happen as quickly as possible without one blocking the other. The team also needs the script to produce enough logging output that the on-call engineer can diagnose failures the next morning — including the case where a job appears to succeed but no data actually changed in the system.

Assume the following environment variables are available at runtime:
- `SFCC_INSTANCE_URL` — base URL of the SFCC instance
- `SFCC_CLIENT_ID` — OCAPI client ID
- `SFCC_CLIENT_SECRET` — OCAPI client secret
- `SFCC_ADMIN_TOKEN` — bearer token for Data API calls
- `SFCC_CATALOG_ID` — catalog ID for catalog imports

## Output Specification

Produce:
1. `import-runner.js` — the Node.js automation script (no external dependencies beyond Node built-ins and `node-fetch` or native `fetch`)
2. `import-log-schema.md` — a short description of what the script logs and how to interpret common failure modes visible in the logs

The script should read the three XML files from a local `./feeds/` directory (filenames: `catalog.xml`, `inventory.xml`, `pricebook.xml`), upload them to SFCC, and trigger the respective jobs. It does not need to actually run — it will be reviewed as source code.
