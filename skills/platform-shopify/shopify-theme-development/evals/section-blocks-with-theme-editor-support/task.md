# Build a Customizable Product Section for a Shopify Theme

## Problem/Feature Description

A direct-to-consumer apparel brand is migrating their Shopify store to a new custom theme. The merchandising team needs a product detail page that their non-technical staff can configure through the Shopify theme editor — rearranging the page content, toggling individual elements, and tweaking copy — without touching code. Currently the product page is a monolithic Liquid file that hardcodes every element, so merchants can't customize anything without a developer.

Your task is to build the product section and its accompanying template for the new theme. The section should support the most common product page content blocks (title, price with sale display, variant picker via radio buttons, add-to-cart button that reflects availability, and product description). It should be structured so that the theme editor can identify each block, and the section should be discoverable in the editor's "Add section" panel.

## Output Specification

Produce the following files representing the theme structure:

- `sections/main-product.liquid` — the Liquid section with schema
- `templates/product.json` — the JSON template that uses the section
- Any snippets you extract for reusability should go under `snippets/`

The section must work with the standard Shopify product object and support multiple product media types (images and video at minimum). Prices should handle sale scenarios (compare-at price vs current price).
