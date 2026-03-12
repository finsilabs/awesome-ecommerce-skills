# Loyalty Points Display on the Cart Page

## Problem/Feature Description

Acme's marketing team has launched a loyalty rewards program. Shoppers earn points on every purchase, and the team wants to display the estimated points they will earn for the current cart contents directly on the cart page. The points calculation is simple: 1 point per whole dollar of the cart subtotal.

You are working on a custom cartridge called `int_acme_loyalty` that sits on top of the existing `app_storefront_base` SFRA cartridge. You need to modify the Cart display so it shows the loyalty points estimate, without replacing the original cart logic or breaking any other cartridge extensions. The cart page should also include a new CSS file `/css/loyalty/points.css` and a JavaScript file `/js/loyalty/points.js` for the points UI.

Additionally, create a standalone ISML template for a "Loyalty Program Information" page that displays loyalty program details fetched from a content asset. The template should use the site's standard page layout and render the content asset body as HTML (the body is authored in Business Manager as rich text). The template should include a breadcrumb and support the CSS/JS assets described above.

## Output Specification

Produce the cartridge files in your working directory under `int_acme_loyalty/`. Deliverables should include:

- The extended Cart controller at `int_acme_loyalty/cartridge/controllers/Cart.js`
- The ISML template for the loyalty information page at `int_acme_loyalty/cartridge/templates/default/loyalty/infoPage.isml`
- A `IMPLEMENTATION_NOTES.md` describing the approach taken and any SFCC-specific conventions used
