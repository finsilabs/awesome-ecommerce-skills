# License Key Inventory System

## Problem Description

A software marketplace sells third-party applications where each sale requires issuing a unique license key to the customer. The keys are pre-purchased in bulk from vendors and need to be stored and dispensed one-by-one as orders come in. The ops team currently tracks these keys in spreadsheets and manually emails them — a process that takes hours and frequently causes customer complaints when they don't receive their key promptly.

The engineering team needs to automate this. The backend is Node.js with a Prisma-like `db` client. The `digitalProductLicenses` table already exists with columns: `id`, `productId`, `licenseKey`, `status` (one of `'available'`, `'sold'`, `'revoked'`), `orderId`, `soldAt`.

A vendor has just delivered a CSV of 500 new keys for a popular product. The ops manager wants an admin API endpoint to import those keys and is worried about accidentally uploading the same batch twice.

Additionally, the ops team has been caught off-guard twice when a product ran out of keys mid-sale, causing failed orders and angry customers. They need a scheduled job that warns them early enough to re-order from the vendor before stock runs out.

## Output Specification

Implement the following in a file `api/admin/license-keys.js`:
- An async function `importLicenseKeys(req, res)` that handles POST requests with `{ productId, keys: string[] }` in the body.
- An async function `assignLicenseKey(orderId, productId)` that picks an available key and assigns it to an order.

Implement the inventory monitoring logic in `jobs/licenseKeyStockCheck.js`, exporting an async function `checkLicenseKeyStockLevels()`. Assume a `notifyAdmin({ subject, message })` function is available.

Add comments in `assignLicenseKey` explaining the concurrency concern it addresses.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/sample-keys.csv ===============
product_id,license_key
prod_antivirus_pro,AAAA-BBBB-CCCC-1111
prod_antivirus_pro,DDDD-EEEE-FFFF-2222
prod_antivirus_pro,GGGG-HHHH-IIII-3333
prod_antivirus_pro,JJJJ-KKKK-LLLL-4444
prod_antivirus_pro,MMMM-NNNN-OOOO-5555
