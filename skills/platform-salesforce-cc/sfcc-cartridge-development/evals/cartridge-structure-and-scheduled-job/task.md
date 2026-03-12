# Inventory Sync Integration Cartridge

## Problem/Feature Description

Acme Co. runs an SFCC storefront and needs to keep their product inventory levels in sync with an external ERP system. Every hour, the ERP exposes a REST endpoint that returns a JSON payload of SKU-to-quantity mappings. Currently, inventory discrepancies between the ERP and the storefront are causing overselling and customer complaints during peak periods.

Your task is to create a new SFCC cartridge called `int_acme_inventory` that includes a scheduled job step capable of calling the ERP API and updating the SFCC inventory list. The operations team needs to be able to update ERP connection settings and switch inventory lists without requiring a code deployment. The job must report success or failure accurately so operations staff can monitor it through the Job Framework's built-in reporting.

## Output Specification

Produce the cartridge as a set of files in your working directory. The deliverable should include:

- All required cartridge metadata and configuration files at the correct paths
- The job step script at `int_acme_inventory/cartridge/scripts/jobs/syncInventory.js`
- A `package.json` at the cartridge root

The ERP API returns JSON in this shape:

```json
{
  "items": [
    { "sku": "ABC-001", "quantity": 50, "inStockDate": "2026-04-01" },
    { "sku": "ABC-002", "quantity": 0 }
  ]
}
```

Write a brief `IMPLEMENTATION_NOTES.md` explaining how the job step parameters should be configured in Business Manager, and noting any conventions you followed.
