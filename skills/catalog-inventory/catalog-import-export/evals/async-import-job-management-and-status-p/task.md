# Bulk Product Upload Service

## Problem Description

SupplyChain Direct, a B2B wholesale supplier, needs to give their merchant partners a way to bulk-upload product catalogs. Their operations team discovered that when merchants try to import thousands of products, the HTTP request times out before the import finishes — leaving merchants with no idea whether their data was accepted. The previous approach blocked on the entire import before responding, causing frustration and support tickets.

The engineering team wants to redesign the import to be non-blocking: the endpoint should accept the file, hand off processing to a background worker, and immediately tell the merchant that the job is queued. Merchants should be able to check back later using a job ID to see how many rows have been processed and whether there were any errors. The system also needs to protect against merchants accidentally uploading the same catalog twice (which has caused duplicate product entries in the past).

Your task is to implement the upload endpoint and the background import job runner as Express route handlers and a job function. You do not need a real database — use an in-memory store (a plain JavaScript object or Map) to simulate the database operations.

## Output Specification

Produce a Node.js application with:

1. `src/importEndpoints.js` — Express route handlers for:
   - `POST /api/catalog/import` — accepts a file upload and starts the import job
   - `GET /api/catalog/import/:jobId` — returns the current status of a job

2. `src/importJob.js` — the background job function that processes rows and updates job state

3. `demo.js` — a runnable script that creates an Express app with the above routes, submits a test import using the provided CSV data (programmatically, without needing an actual HTTP server running), and prints the initial queued response and a final status after processing completes

Run `demo.js` and capture its output to `demo-output.txt`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/wholesale-catalog.csv ===============
handle,title,vendor,product_type,tags,price,compare_at_price,sku,inventory_quantity,option1_name,option1_value,published
industrial-shelf-unit,Industrial Shelf Unit,SCD Furniture,Shelving,"industrial,metal,storage",349.00,420.00,SCD-SHF-001,200,Size,Large,true
mobile-workbench,Mobile Workbench with Drawers,SCD Furniture,Workbenches,"mobile,workshop,drawers",549.00,650.00,SCD-WRK-002,85,Size,Standard,true
heavy-duty-pallet,Heavy Duty Wooden Pallet,SCD Logistics,Pallets,"wooden,heavy-duty,logistics",24.99,,SCD-PLT-003,5000,,,,true
warehouse-label-printer,Wireless Label Printer,SCD Tech,Printers,"wireless,labels,barcode",189.00,230.00,SCD-PRT-004,150,,,,true
forklift-attachment-hook,Forklift Hook Attachment,SCD Equipment,Attachments,"forklift,hook,lifting",299.00,,SCD-FRK-005,45,Load Capacity,1000kg,true
safety-vest-orange,Orange High-Vis Safety Vest,SCD Safety,PPE,"safety,hi-vis,orange",12.99,16.00,SCD-VES-006,1200,Size,Large,true
cable-tie-assortment,Cable Tie Assortment Pack,SCD Hardware,Fasteners,"cable-ties,assorted,pack",8.50,,SCD-CBL-007,3000,,,,1
stretch-wrap-roll,Industrial Stretch Wrap Roll,SCD Packaging,Packaging,"stretch-wrap,industrial,rolls",35.00,42.00,SCD-WRP-008,800,,,,true
dock-bumper-rubber,Rubber Dock Bumper,SCD Logistics,Dock Equipment,"rubber,dock,bumper",89.00,,SCD-DCK-009,120,,,,true
led-work-light,LED Portable Work Light,SCD Lighting,Lighting,"led,portable,work-light",79.99,95.00,SCD-LGT-010,340,,,,true
industrial-shelf-unit,Industrial Shelf Unit RESTOCK,SCD Furniture,Shelving,"industrial,metal,storage",329.00,420.00,SCD-SHF-001,250,Size,Large,true
safety-vest-orange,Orange High-Vis Safety Vest RESTOCK,SCD Safety,PPE,"safety,hi-vis,orange",11.99,16.00,SCD-VES-006,1500,Size,Large,true
