---
name: sfcc-cartridge-development
description: "Build SFRA-based Salesforce Commerce Cloud cartridges with controllers, ISML templates, and hooks to customize storefront behavior"
category: platform-salesforce-cc
risk: safe
source: curated
date_added: "2026-03-12"
tags: [sfcc, salesforce-commerce-cloud, sfra, cartridge, isml, controllers, pipelines]
triggers: ["build sfcc cartridge", "sfra development", "salesforce commerce cloud customization", "create sfcc controller"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [salesforce-commerce-cloud]
difficulty: advanced
---

# SFCC Cartridge Development

## Overview

Build custom cartridges for Salesforce Commerce Cloud (SFCC) using the Storefront Reference Architecture (SFRA), server-side JavaScript controllers, ISML templates, models, and the B2C Commerce Script API. This skill covers cartridge layering and the override mechanism, route handling with `server.js`, form handling, OCAPI/SCAPI integration, and Job Framework usage for scheduled data processing.

## When to Use This Skill

- When building a custom feature cartridge that extends SFRA functionality
- When overriding or extending existing SFRA controllers, templates, or models
- When implementing custom checkout steps or payment integrations on SFCC
- When creating scheduled jobs for data import/export (product feeds, order sync)
- When building OCAPI hooks or SCAPI integrations for headless storefronts

## Core Instructions

1. **Set up the cartridge structure and layering**

   SFCC uses a cartridge path for layering. Cartridges higher in the path override those lower. A custom cartridge extends `app_storefront_base`:

   ```
   int_acme_custom/
   ├── cartridge/
   │   ├── controllers/       # Server-side JS controllers
   │   ├── models/            # Data model wrappers
   │   ├── scripts/           # Business logic helpers
   │   ├── templates/
   │   │   └── default/       # ISML templates
   │   ├── forms/
   │   │   └── default/       # Form definitions (XML)
   │   ├── static/
   │   │   └── default/
   │   │       ├── css/
   │   │       └── js/
   │   └── int_acme_custom.properties  # Cartridge metadata
   └── package.json
   ```

   Set the cartridge path in Business Manager:
   ```
   int_acme_custom:app_storefront_base
   ```

   `int_acme_custom.properties`:
   ```properties
   ## cartridge.properties
   demandware.cartridges.int_acme_custom.multipleLanguageStorefront=true
   ```

2. **Create a server-side controller**

   Controllers in SFRA use `server.js` for route registration:

   ```javascript
   // controllers/CustomPage.js
   'use strict';

   var server = require('server');
   var cache = require('*/cartridge/scripts/middleware/cache');
   var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

   /**
    * CustomPage-Show : Renders a custom content page
    * @name CustomPage-Show
    * @function
    * @memberof CustomPage
    * @param {middleware} - server.middleware.https
    * @param {middleware} - consentTracking.consent
    * @param {middleware} - cache.applyDefaultCache
    * @param {querystringparameter} - cid : content asset ID
    * @param {renders} - isml
    * @param {serverfunction} - get
    */
   server.get('Show',
       server.middleware.https,
       consentTracking.consent,
       cache.applyDefaultCache,
       function (req, res, next) {
           var ContentMgr = require('dw/content/ContentMgr');
           var ContentModel = require('*/cartridge/models/content');

           var contentId = req.querystring.cid;
           var apiContent = ContentMgr.getContent(contentId);

           if (!apiContent) {
               res.setStatusCode(404);
               res.render('error/notFound');
               return next();
           }

           var contentModel = new ContentModel(apiContent);

           res.render('custom/contentPage', {
               content: contentModel,
               breadcrumbs: [
                   { htmlValue: 'Home', url: '/' },
                   { htmlValue: contentModel.name, url: '' }
               ]
           });

           next();
       }
   );

   /**
    * CustomPage-Submit : Handles form POST submissions
    */
   server.post('Submit',
       server.middleware.https,
       function (req, res, next) {
           var Transaction = require('dw/system/Transaction');
           var CustomObjectMgr = require('dw/object/CustomObjectMgr');

           var form = req.form;
           var name = form.name;
           var email = form.email;

           // Validate input
           if (!name || !email) {
               res.json({ success: false, error: 'Name and email are required.' });
               return next();
           }

           try {
               Transaction.wrap(function () {
                   var co = CustomObjectMgr.createCustomObject('AcmeSubmissions', email);
                   co.custom.name = name;
                   co.custom.submittedAt = new Date();
               });

               res.json({ success: true, message: 'Submission received.' });
           } catch (e) {
               var Logger = require('dw/system/Logger');
               Logger.error('Submission failed: {0}', e.message);
               res.json({ success: false, error: 'An error occurred. Please try again.' });
           }

           next();
       }
   );

   module.exports = server.exports();
   ```

3. **Extend an existing SFRA controller**

   Use `server.extend` to add or modify routes on an existing controller:

   ```javascript
   // controllers/Cart.js — extending app_storefront_base Cart
   'use strict';

   var server = require('server');
   var page = module.superModule;  // Reference to the base Cart controller
   server.extend(page);

   /**
    * Cart-Show : Append custom data to the Cart page
    */
   server.append('Show', function (req, res, next) {
       var viewData = res.getViewData();

       // Add custom upsell products to the cart page
       var ProductMgr = require('dw/catalog/ProductMgr');
       var ArrayList = require('dw/util/ArrayList');
       var upsells = new ArrayList();

       var basket = require('dw/order/BasketMgr').getCurrentBasket();
       if (basket) {
           var items = basket.getAllProductLineItems();
           for (var i = 0; i < items.length; i++) {
               var recommendations = items[i].product.getRecommendations();
               for (var j = 0; j < Math.min(recommendations.length, 2); j++) {
                   upsells.push(recommendations[j].getRecommendedItem());
               }
           }
       }

       viewData.upsellProducts = upsells.toArray().slice(0, 4);
       res.setViewData(viewData);
       next();
   });

   /**
    * Cart-AddCustomItem : New route added to the Cart controller
    */
   server.post('AddCustomItem', function (req, res, next) {
       var BasketMgr = require('dw/order/BasketMgr');
       var Transaction = require('dw/system/Transaction');
       var ProductMgr = require('dw/catalog/ProductMgr');

       var productId = req.form.pid;
       var quantity = parseInt(req.form.quantity, 10) || 1;
       var product = ProductMgr.getProduct(productId);

       if (!product || !product.isOnline()) {
           res.json({ error: true, message: 'Product not available.' });
           return next();
       }

       var basket = BasketMgr.getCurrentOrNewBasket();
       Transaction.wrap(function () {
           var pli = basket.createProductLineItem(productId, basket.getDefaultShipment());
           pli.setQuantityValue(quantity);
       });

       res.json({ success: true, itemCount: basket.productQuantityTotal });
       next();
   });

   module.exports = server.exports();
   ```

4. **Write ISML templates**

   ```html
   <--- templates/default/custom/contentPage.isml --->
   <isdecorate template="common/layout/page">

       <isscript>
           var assets = require('*/cartridge/scripts/assets');
           assets.addCss('/css/custom/content.css');
           assets.addJs('/js/custom/content.js');
       </isscript>

       <div class="container custom-content-page">
           <div class="row">
               <div class="col-12">
                   <nav aria-label="Breadcrumb">
                       <ol class="breadcrumb">
                           <isloop items="${pdict.breadcrumbs}" var="crumb" status="loopstatus">
                               <isif condition="${loopstatus.last}">
                                   <li class="breadcrumb-item active">${crumb.htmlValue}</li>
                               <iselse/>
                                   <li class="breadcrumb-item">
                                       <a href="${crumb.url}">${crumb.htmlValue}</a>
                                   </li>
                               </isif>
                           </isloop>
                       </ol>
                   </nav>

                   <h1>${pdict.content.name}</h1>
                   <div class="content-body">
                       <isprint value="${pdict.content.body}" encoding="off"/>
                   </div>
               </div>
           </div>
       </div>

   </isdecorate>
   ```

5. **Create a data model wrapper**

   ```javascript
   // models/content.js
   'use strict';

   var URLUtils = require('dw/web/URLUtils');

   /**
    * Content model wrapping a dw.content.Content API object
    * @param {dw.content.Content} contentObj - Content API object
    * @constructor
    */
   function ContentModel(contentObj) {
       this.id = contentObj.ID;
       this.name = contentObj.name || contentObj.ID;
       this.body = contentObj.custom.body ? contentObj.custom.body.markup : '';
       this.online = contentObj.online;
       this.url = URLUtils.url('CustomPage-Show', 'cid', contentObj.ID).toString();
       this.pageTitle = contentObj.pageTitle || this.name;
       this.pageDescription = contentObj.pageDescription || '';
       this.pageKeywords = contentObj.pageKeywords || '';
   }

   module.exports = ContentModel;
   ```

6. **Build a scheduled job for data processing**

   ```javascript
   // scripts/jobs/syncInventory.js
   'use strict';

   var Status = require('dw/system/Status');
   var Logger = require('dw/system/Logger').getLogger('inventory-sync', 'acme');
   var HTTPClient = require('dw/net/HTTPClient');
   var Transaction = require('dw/system/Transaction');
   var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

   /**
    * Job step: Fetch inventory from external ERP and update SFCC
    * @param {dw.util.HashMap} params - Job step parameters
    * @returns {dw.system.Status} - Job status
    */
   function execute(params) {
       var apiUrl = params.get('apiUrl');
       var apiKey = params.get('apiKey');
       var inventoryListId = params.get('inventoryListId') || 'default';

       var httpClient = new HTTPClient();
       httpClient.open('GET', apiUrl);
       httpClient.setRequestHeader('Authorization', 'Bearer ' + apiKey);
       httpClient.setRequestHeader('Accept', 'application/json');
       httpClient.setTimeout(30000);
       httpClient.send();

       if (httpClient.statusCode !== 200) {
           Logger.error('ERP API returned status {0}', httpClient.statusCode);
           return new Status(Status.ERROR, 'API_ERROR', 'ERP API returned ' + httpClient.statusCode);
       }

       var inventory = JSON.parse(httpClient.text);
       var inventoryList = ProductInventoryMgr.getInventoryList(inventoryListId);

       if (!inventoryList) {
           return new Status(Status.ERROR, 'LIST_NOT_FOUND', 'Inventory list not found');
       }

       var updated = 0;
       var errors = 0;

       inventory.items.forEach(function (item) {
           try {
               Transaction.wrap(function () {
                   var record = inventoryList.getRecord(item.sku);
                   if (!record) {
                       record = inventoryList.createRecord(item.sku);
                   }
                   record.setAllocation(item.quantity);
                   if (item.inStockDate) {
                       record.setInStockDate(new Date(item.inStockDate));
                   }
               });
               updated++;
           } catch (e) {
               Logger.error('Failed to update SKU {0}: {1}', item.sku, e.message);
               errors++;
           }
       });

       Logger.info('Inventory sync complete: {0} updated, {1} errors', updated, errors);
       return new Status(Status.OK, 'SYNC_COMPLETE', updated + ' records updated');
   }

   module.exports.execute = execute;
   ```

## Examples

### OCAPI hook for order creation

```javascript
// hooks/order/ocapiHooks.js
'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('ocapi-hooks', 'acme');

/**
 * OCAPI after-POST hook for order creation
 * Called after a new order is placed via OCAPI
 */
exports.afterPOST = function (order) {
    try {
        // Send order data to external analytics
        var HTTPClient = require('dw/net/HTTPClient');
        var httpClient = new HTTPClient();
        httpClient.open('POST', 'https://analytics.acme.com/orders');
        httpClient.setRequestHeader('Content-Type', 'application/json');
        httpClient.send(JSON.stringify({
            orderId: order.orderNo,
            total: order.totalGrossPrice.value,
            currency: order.currencyCode,
            itemCount: order.productLineItems.length,
            customerEmail: order.customerEmail,
        }));

        if (httpClient.statusCode !== 200) {
            Logger.warn('Analytics push failed for order {0}: HTTP {1}',
                order.orderNo, httpClient.statusCode);
        }
    } catch (e) {
        Logger.error('OCAPI hook error: {0}', e.message);
    }

    return new Status(Status.OK);
};
```

Register in `hooks.json`:
```json
{
    "hooks": [
        {
            "name": "dw.ocapi.shop.order.afterPOST",
            "script": "./hooks/order/ocapiHooks"
        }
    ]
}
```

### Form definition and server-side validation

```xml
<!-- forms/default/contactus.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <field formid="name" label="form.contactus.name"
           type="string" mandatory="true" max-length="100"/>
    <field formid="email" label="form.contactus.email"
           type="string" mandatory="true" max-length="254"
           regexp="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"/>
    <field formid="message" label="form.contactus.message"
           type="string" mandatory="true" max-length="2000"/>
    <action formid="submit" label="form.contactus.submit" valid-form="true"/>
</form>
```

```javascript
// controllers/ContactUs.js
'use strict';
var server = require('server');

server.get('Show', function (req, res, next) {
    var contactForm = server.forms.getForm('contactus');
    contactForm.clear();
    res.render('contactus/form', { contactForm: contactForm });
    next();
});

server.post('Submit', function (req, res, next) {
    var contactForm = server.forms.getForm('contactus');

    if (contactForm.valid) {
        var Transaction = require('dw/system/Transaction');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');

        Transaction.wrap(function () {
            var co = CustomObjectMgr.createCustomObject(
                'ContactSubmission',
                require('dw/util/UUIDUtils').createUUID()
            );
            co.custom.name = contactForm.name.value;
            co.custom.email = contactForm.email.value;
            co.custom.message = contactForm.message.value;
        });

        res.json({ success: true });
    } else {
        res.json({
            success: false,
            fields: {
                name: contactForm.name.error || null,
                email: contactForm.email.error || null,
                message: contactForm.message.error || null,
            }
        });
    }
    next();
});

module.exports = server.exports();
```

## Best Practices

- **Follow the cartridge layering convention** -- custom cartridges override base cartridges; use `module.superModule` to extend rather than replace controllers
- **Use `server.append` over `server.replace`** -- appending preserves the original controller logic and other cartridge extensions; replacing breaks the chain
- **Wrap all database writes in `Transaction.wrap()`** -- SFCC requires explicit transactions for all persistent changes; missing transactions cause silent failures
- **Use the Script API, not direct database access** -- SFCC has no direct SQL access; always use `*Mgr` classes (ProductMgr, BasketMgr, OrderMgr) for data operations
- **Log with categorized loggers** -- use `Logger.getLogger(category, prefix)` so log messages can be filtered in Log Center by category
- **Never hardcode site-specific values** -- use Site Preferences (custom site preferences in Business Manager) for configurable values like API keys and feature flags
- **Test with the SFCC sandbox** -- always develop and test on a sandbox instance before deploying to staging or production
- **Use the SFCC linting rules** -- enforce `'use strict'` and check for missing `next()` calls in controllers, which cause request hanging

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Controller route not found (404) | Verify the cartridge is in the cartridge path (Business Manager > Sites > Manage Sites > Cartridges) and the controller file name matches the route |
| `module.superModule` returns null | Ensure the base cartridge is listed after your custom cartridge in the cartridge path; the order matters |
| Template changes not appearing | Clear the SFCC template cache in Business Manager (Administration > Sites > Manage Sites > Cache); ISML templates are aggressively cached |
| Custom Object not persisting | Ensure the operation is inside `Transaction.wrap()`; check that the Custom Object type is defined in Business Manager (Administration > Site Development > Custom Objects) |
| Job step fails silently | Return a `Status` object from every job step; return `Status.ERROR` on failure so the job framework reports the failure correctly |
| ISML `<isprint>` double-escaping HTML | Use `encoding="off"` in `<isprint>` for trusted HTML content (e.g., CMS body markup); use default encoding for user-generated content |

## Related Skills

- @erp-integration
- @ecommerce-caching
- @ecommerce-seo
- @pci-dss-compliance
- @product-data-modeling
