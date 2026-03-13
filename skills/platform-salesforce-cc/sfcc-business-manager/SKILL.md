---
name: sfcc-business-manager
description: "Configure Salesforce Commerce Cloud via Business Manager — manage catalogs, promotions, site preferences, and run XML import/export jobs"
category: platform-salesforce-cc
risk: safe
source: curated
date_added: "2026-03-12"
tags: [salesforce-commerce-cloud, sfcc, business-manager, import-export, xml, site-preferences, promotions, catalog]
triggers: ["sfcc business manager", "salesforce commerce business manager", "sfcc import export", "sfcc catalog import", "sfcc xml import", "sfcc site preferences", "sfcc promotions"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [salesforce-commerce-cloud]
difficulty: intermediate
---

# SFCC Business Manager

## Overview

Business Manager (BM) is the SFCC administration interface accessed at `https://{instance}.dx.commercecloud.salesforce.com/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage`. It controls every aspect of the SFCC installation: catalog and product management, site preferences, promotion engine, content assets, A/B tests, and job scheduling. Bulk data operations are performed via XML import/export using the Import & Export framework, which processes files from the IMPEX directory via scheduled jobs.

## When to Use This Skill

- When performing initial catalog setup for a new SFCC site
- When importing products, prices, or inventory from an ERP or PIM system via XML
- When configuring OCAPI settings for API client registrations
- When setting up site preferences for custom cartridge configurations
- When managing promotions, coupon campaigns, and A/B tests across sites
- When diagnosing job failures or reviewing import error logs in Business Manager

## Core Instructions

1. **Navigate key Business Manager areas**

   Business Manager URLs follow the pattern `{instanceUrl}/on/demandware.store/Sites-Site/default/{Controller-Action}`:

   ```
   # Site Selection (global)
   /on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage

   # Catalog Management (site-specific)
   /on/demandware.store/Sites-{SiteID}/default/ViewCategories-Start

   # Site Preferences
   /on/demandware.store/Sites-{SiteID}/default/ViewSitePreference-StartGroups

   # OCAPI Settings
   /on/demandware.store/Sites-Site/default/ViewApplicationApiSettings-Start

   # Import & Export
   /on/demandware.store/Sites-{SiteID}/default/ViewJobSchedule-Start

   # Job Execution
   /on/demandware.store/Sites-Site/default/ViewJobSchedule-Start
   ```

2. **Import products via XML catalog import**

   SFCC catalog XML follows Demandware's `catalog.xsd` schema. Products are imported as catalog objects:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" catalog-id="your-catalog">

     <!-- Category definition -->
     <category category-id="electronics">
       <display-name xml:lang="x-default">Electronics</display-name>
       <display-name xml:lang="en-US">Electronics</display-name>
       <online-flag>true</online-flag>
       <parent>root</parent>
     </category>

     <!-- Simple product -->
     <product product-id="PROD-001">
       <ean>1234567890123</ean>
       <upc>123456789012</upc>
       <display-name xml:lang="x-default">Wireless Headphones Pro</display-name>
       <display-name xml:lang="en-US">Wireless Headphones Pro</display-name>
       <long-description xml:lang="x-default">Premium wireless headphones with ANC</long-description>
       <online-flag>true</online-flag>
       <available-flag>true</available-flag>
       <searchable-flag>true</searchable-flag>
       <tax-class-id>standard</tax-class-id>
       <brand>AudioPro</brand>
       <manufacturer-sku>AP-WH-001</manufacturer-sku>
       <classification-category catalog-id="your-catalog">electronics</classification-category>
       <images>
         <image-group view-type="large">
           <image path="products/PROD-001-large.jpg"/>
         </image-group>
         <image-group view-type="small">
           <image path="products/PROD-001-small.jpg"/>
         </image-group>
       </images>
       <custom-attributes>
         <custom-attribute attribute-id="color">Black</custom-attribute>
         <custom-attribute attribute-id="batteryLife">30</custom-attribute>
       </custom-attributes>
     </product>

     <!-- Variation master product -->
     <product product-id="SHIRT-MASTER">
       <display-name xml:lang="x-default">Classic Cotton Shirt</display-name>
       <online-flag>true</online-flag>
       <classification-category catalog-id="your-catalog">apparel</classification-category>
       <variations>
         <attributes>
           <variation-attribute attribute-id="color" variation-attribute-id="color">
             <display-name xml:lang="x-default">Color</display-name>
             <variation-attribute-values>
               <variation-attribute-value value="Blue">
                 <display-value xml:lang="x-default">Blue</display-value>
               </variation-attribute-value>
               <variation-attribute-value value="Red">
                 <display-value xml:lang="x-default">Red</display-value>
               </variation-attribute-value>
             </variation-attribute-values>
           </variation-attribute>
           <variation-attribute attribute-id="size" variation-attribute-id="size">
             <display-name xml:lang="x-default">Size</display-name>
             <variation-attribute-values>
               <variation-attribute-value value="S"><display-value xml:lang="x-default">S</display-value></variation-attribute-value>
               <variation-attribute-value value="M"><display-value xml:lang="x-default">M</display-value></variation-attribute-value>
               <variation-attribute-value value="L"><display-value xml:lang="x-default">L</display-value></variation-attribute-value>
             </variation-attribute-values>
           </variation-attribute>
         </attributes>
         <variants>
           <variant product-id="SHIRT-BLUE-S"/>
           <variant product-id="SHIRT-BLUE-M"/>
           <variant product-id="SHIRT-RED-M"/>
         </variants>
       </variations>
     </product>

     <!-- Variant products -->
     <product product-id="SHIRT-BLUE-S">
       <display-name xml:lang="x-default">Classic Cotton Shirt - Blue / S</display-name>
       <online-flag>true</online-flag>
       <variation-attribute-values>
         <variation-attribute-value attribute-id="color">Blue</variation-attribute-value>
         <variation-attribute-value attribute-id="size">S</variation-attribute-value>
       </variation-attribute-values>
     </product>

     <!-- Product category assignment -->
     <category-assignment category-id="electronics" product-id="PROD-001">
       <primary-flag>true</primary-flag>
     </category-assignment>
   </catalog>
   ```

3. **Import inventory and prices**

   ```xml
   <!-- inventory.xml — import stock levels -->
   <?xml version="1.0" encoding="UTF-8"?>
   <inventory xmlns="http://www.demandware.com/xml/impex/inventory/2007-05-31">
     <inventory-list>
       <header list-id="your-inventory-list">
         <default-in-stock>false</default-in-stock>
         <description>Main Inventory</description>
       </header>
       <records>
         <record product-id="PROD-001">
           <allocation>150.00</allocation>
           <allocation-timestamp>2026-03-12T00:00:00.000Z</allocation-timestamp>
           <perpetual>false</perpetual>
           <preorderable>false</preorderable>
           <backorderable>false</backorderable>
         </record>
         <record product-id="SHIRT-BLUE-S">
           <allocation>42.00</allocation>
           <perpetual>false</perpetual>
         </record>
       </records>
     </inventory-list>
   </inventory>
   ```

   ```xml
   <!-- pricebook.xml — import prices -->
   <?xml version="1.0" encoding="UTF-8"?>
   <pricebooks xmlns="http://www.demandware.com/xml/impex/pricebook/2006-10-31">
     <pricebook>
       <header pricebook-id="usd-m-list-prices">
         <currency>USD</currency>
         <display-name xml:lang="x-default">USD List Prices</display-name>
         <online-flag>true</online-flag>
       </header>
       <price-tables>
         <price-table product-id="PROD-001">
           <amount quantity="1">149.99</amount>
         </price-table>
         <price-table product-id="SHIRT-BLUE-S">
           <amount quantity="1">39.99</amount>
         </price-table>
       </price-tables>
     </pricebook>
   </pricebooks>
   ```

4. **Configure site preferences for custom cartridge settings**

   Site preferences are custom attributes defined in Business Manager → Administration → Site Development → System Object Types → SitePreferences:

   ```xml
   <!-- system-objecttype-extensions.xml — define custom site preference -->
   <?xml version="1.0" encoding="UTF-8"?>
   <metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
     <type-extension type-id="SitePreferences">
       <custom-attribute-definitions>
         <attribute-definition attribute-id="myIntegration_apiEndpoint">
           <display-name xml:lang="x-default">My Integration API Endpoint</display-name>
           <type>string</type>
           <mandatory-flag>false</mandatory-flag>
           <externally-managed-flag>false</externally-managed-flag>
           <min-length>0</min-length>
           <max-length>255</max-length>
         </attribute-definition>
         <attribute-definition attribute-id="myIntegration_enabledFlag">
           <display-name xml:lang="x-default">My Integration Enabled</display-name>
           <type>boolean</type>
           <mandatory-flag>false</mandatory-flag>
         </attribute-definition>
       </custom-attribute-definitions>
       <group-definitions>
         <attribute-group group-id="MyIntegration">
           <display-name xml:lang="x-default">My Integration Settings</display-name>
           <attribute attribute-id="myIntegration_apiEndpoint"/>
           <attribute attribute-id="myIntegration_enabledFlag"/>
         </attribute-group>
       </group-definitions>
     </type-extension>
   </metadata>
   ```

   Access in cartridge ISML/controller:

   ```javascript
   // In SFCC ISML controller (server-side JS)
   var Site = require('dw/system/Site');
   var currentSite = Site.getCurrent();

   var apiEndpoint = currentSite.getCustomPreferenceValue('myIntegration_apiEndpoint');
   var isEnabled = currentSite.getCustomPreferenceValue('myIntegration_enabledFlag');
   ```

5. **Configure and run import jobs**

   SFCC import jobs are configured in Business Manager → Administration → Operations → Jobs. Jobs use XML feed files placed in `/IMPEX/src/` or uploaded via the Jobs API:

   ```javascript
   // Upload an XML file to IMPEX via OCAPI WebDAV before triggering job
   const importFile = fs.readFileSync('./catalog.xml');

   // Upload via WebDAV (SFCC exposes IMPEX as WebDAV)
   const webdavUrl = `${instanceUrl}/on/demandware.servlet/webdav/Sites/Impex/src/catalog-import.xml`;

   await fetch(webdavUrl, {
     method: "PUT",
     headers: {
       Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
       "Content-Type": "application/xml",
     },
     body: importFile,
   });

   // Trigger the import job via Jobs API
   const jobResponse = await fetch(
     `${instanceUrl}/s/-/dw/data/v23_2/jobs/sfcc-site-archive-import/executions`,
     {
       method: "POST",
       headers: {
         Authorization: `Bearer ${adminToken}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         parameters: [
           { name: "ImportFile", value: "catalog-import.xml" },
           { name: "catalogID", value: "your-catalog" },
         ],
       }),
     }
   );
   ```

## Examples

### Export orders for ERP sync

```xml
<!-- Order export configuration — Business Manager → Merchant Tools → Site Preferences → Export/Import -->
<!-- Or via OCAPI Data API order search: -->
```

```javascript
// Paginated order export via OCAPI Data API
async function exportOrdersSince(sinceDate: string) {
  const token = await getAdminToken();
  const instanceUrl = process.env.SFCC_INSTANCE_URL!;
  const siteId = process.env.SFCC_SITE_ID!;

  let start = 0;
  const count = 100;
  const allOrders = [];

  while (true) {
    const response = await fetch(
      `${instanceUrl}/s/${siteId}/dw/data/v23_2/order_search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            filtered_query: {
              query: { match_all_query: {} },
              filter: {
                range_filter: {
                  field: "creation_date",
                  from: sinceDate,
                },
              },
            },
          },
          select: "(**)",
          count,
          start,
          sorts: [{ field: "creation_date", sort_order: "asc" }],
        }),
      }
    );

    const { hits, total } = await response.json();
    allOrders.push(...(hits ?? []));
    start += count;
    if (start >= total) break;
  }

  return allOrders;
}
```

### Create a promotion via OCAPI

```javascript
async function createPromotion(promo: {
  id: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}) {
  const token = await getAdminToken();
  const instanceUrl = process.env.SFCC_INSTANCE_URL!;
  const siteId = process.env.SFCC_SITE_ID!;

  await fetch(
    `${instanceUrl}/s/${siteId}/dw/data/v23_2/promotions/${promo.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: promo.id,
        name: { default: promo.name },
        enabled: true,
        start_date: promo.startDate,
        end_date: promo.endDate,
        discount: {
          type: "percentage",
          value: promo.discountPercent,
        },
        promotion_class: "order",
      }),
    }
  );
}
```

## Best Practices

- **Validate XML imports against Demandware schemas** before uploading — the XSD files are available in Business Manager under Administration → Site Development → System Object Types; invalid XML fails silently without line-level error messages
- **Use unique job IDs for concurrent imports** — SFCC jobs are single-threaded per job definition; use multiple job definitions if you need parallel catalog + inventory imports
- **Always include `catalog-id` in catalog XML** — mismatched or missing catalog IDs cause products to import into the wrong catalog or fail completely
- **Test imports on staging before production** — there is no bulk "undo" for catalog imports; test with a small subset first
- **Monitor job logs in BM → Administration → Operations → Jobs** — failed jobs log to `/IMPEX/log/`; download and review logs immediately after automated imports
- **Use `<display-name xml:lang="x-default">` for all localized strings** — the `x-default` locale is required; missing it causes display issues in all locales
- **Set site preferences via import XML, not manually** — document all custom site preference values in XML files committed to version control for environment consistency

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products imported but not visible in storefront | Check product `online-flag` is `true`, the category assignment has `primary-flag` set, and the site catalog is assigned to the current site |
| Import job completes but log shows "0 records processed" | Verify the file was uploaded to the correct IMPEX path and the job's `ImportFile` parameter matches the exact filename including extension |
| Custom site preference not appearing in BM UI | Ensure the `system-objecttype-extensions.xml` has been imported via BM → Administration → Site Development → Import & Export and the cache has been cleared |
| Inventory not updating despite successful import | Check that the `inventory-list` `list-id` in the XML matches the inventory list assigned to the site in BM → Merchant Tools → Products and Catalogs |
| OCAPI Data API returns 403 on job trigger | The client ID must have Data API permissions for the `jobs` resource; verify in BM → Administration → Site Development → OCAPI Settings → Data |
| Prices show default catalog price instead of imported pricebook | Assign the pricebook to the site customer groups in BM → Merchant Tools → Pricing → Pricebooks; imported pricebooks are not active until assigned |

## Related Skills

- @sfcc-cartridge-development
- @sfcc-ocapi-scapi
- @catalog-management
- @product-import-export
- @promotion-engine
