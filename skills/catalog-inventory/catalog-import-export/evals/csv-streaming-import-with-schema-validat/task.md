# Merchant Catalog Onboarding Tool

## Problem Description

A boutique fashion retailer, Marigold & Co., is migrating from a legacy ERP system to a new e-commerce platform. Their product team exports their catalog as a CSV spreadsheet every morning and needs a reliable tool to ingest those files into the platform's product database.

The catalog team has run into issues before: a previous import tool crashed on files larger than a few megabytes, silently skipped rows with bad data, and occasionally created duplicate products when the import was accidentally run twice. The new tool needs to handle real-world messy data — including missing prices, malformed product handles, and inconsistent casing — by clearly identifying which rows have problems and why, rather than failing silently.

The platform's product model uses a `handle` (URL slug), `sku`, `price`, `inventory_quantity`, `published` status, and optional variant options. Before merchants commit a large batch, they want to preview exactly how many rows will succeed and what errors exist in the file, without actually writing anything to the database.

## Output Specification

Build a Node.js module at `src/catalogParser.js` (or equivalent path) that:

1. Exports a streaming async generator function `parseCatalogCsv(filePath)` that processes a CSV file row by row
2. Each yielded value should carry the row number, parsed data (if valid), and any validation errors (if invalid)
3. Exports a `dryRunImport(filePath)` function that runs validation only and returns a summary

Also produce `sample-output.json` — run the dry-run function against the provided test CSV and write the result to this file.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.csv ===============
handle,title,description,vendor,product_type,tags,price,compare_at_price,sku,inventory_quantity,weight_kg,option1_name,option1_value,option2_name,option2_value,image_url,published
marigold-wrap-dress,Marigold Wrap Dress,A flowing summer wrap dress,Marigold & Co,Dresses,"summer,wrap,floral",89.99,120.00,MGD-WRP-001,45,0.3,Size,Small,,,,true
silk-blouse-cream,Cream Silk Blouse,Lightweight silk blouse for office wear,Marigold & Co,Tops,"silk,office,cream",149.00,,MGD-SLK-002,12,0.2,Size,Medium,,,,1
INVALID HANDLE,Striped Linen Trousers,,Marigold & Co,Trousers,,95.00,,MGD-LIN-003,20,0.5,Size,10,,,,true
cargo-pants-khaki,Cargo Pants Khaki,Durable outdoor cargo pants,Marigold & Co,Trousers,"outdoor,cargo",75.00,95.00,MGD-CRG-004,-5,0.7,Size,32,,,,false
evening-gown-black,Black Evening Gown,Elegant floor-length gown,Marigold & Co,Dresses,"evening,formal,black",299.00,450.00,MGD-EVN-005,8,1.1,Size,Small,Color,Black,https://cdn.marigold.com/gown-black.jpg,true
,Missing Handle Product,No handle provided,,Tops,,45.00,,MGD-MSS-006,30,,,,,,,true
floral-scarf-silk,Floral Silk Scarf,Hand-painted silk scarf,Marigold & Co,Accessories,"floral,silk,scarf",55.00,,MGD-SCF-007,100,0.05,,,,,,0
denim-jacket-indigo,Indigo Denim Jacket,Classic indigo denim jacket,Marigold & Co,Jackets,"denim,indigo,classic",185.00,220.00,MGD-DNM-008,15,0.9,Size,Large,,,,true
velvet-blazer,Velvet Blazer,Luxurious velvet evening blazer,Marigold & Co,Blazers,,not-a-number,,MGD-VLV-009,7,0.6,Size,38,,,,true
cashmere-turtleneck,Cashmere Turtleneck,Premium cashmere turtleneck sweater,Marigold & Co,Knitwear,"cashmere,winter,luxury",225.00,280.00,MGD-CSH-010,22,0.4,Size,Medium,,,,true
