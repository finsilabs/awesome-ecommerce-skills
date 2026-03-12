# Navigation Panel Components for an Online Apparel Store

## Problem/Feature Description

A mid-size apparel retailer is rebuilding their storefront navigation. The merchandising team frequently rotates seasonal banners and swaps in featured products during promotions — they need to be able to do this without filing engineering tickets. The tech lead has decided to drive the navigation structure from a JSON payload returned by their headless CMS, so the same component code works for every campaign.

Your task is to build the React components that render a mega menu panel from that CMS payload. The panel should display category columns on the left, a featured-products strip in the middle, and a promotional banner on the right. The site has a performance-conscious audience and the tech lead cares about a smooth, fast page experience.

## Output Specification

Produce the following files:

- `MegaPanel.jsx` — the React component that renders a single mega menu panel given a `panel` prop (matching the structure in the provided data)
- `MegaNav.jsx` — a minimal navigation bar that renders a list of top-level items and mounts `MegaPanel` for any item with a `megaMenu` field; it must handle both hover open/close and clean up any timers
- `navigation.js` — a data-fetching helper that retrieves the navigation JSON from a CMS endpoint and is wired for Next.js ISR caching
- `mega-panel.css` — CSS for the mega panel layout and the responsive breakpoint that handles small screens

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/nav-data-sample.json ===============
[
  {
    "id": "womens",
    "label": "Women's",
    "url": "/collections/womens",
    "megaMenu": {
      "columns": [
        {
          "heading": "Clothing",
          "links": [
            { "label": "Tops", "url": "/collections/womens-tops" },
            { "label": "Bottoms", "url": "/collections/womens-bottoms" },
            { "label": "Dresses", "url": "/collections/womens-dresses" }
          ]
        },
        {
          "heading": "Shoes",
          "links": [
            { "label": "Sneakers", "url": "/collections/womens-sneakers" },
            { "label": "Boots", "url": "/collections/womens-boots" }
          ]
        }
      ],
      "featuredProducts": [
        { "id": "prod_001", "name": "Summer Dress", "price": 89, "image": "/images/summer-dress.jpg", "url": "/products/summer-dress" },
        { "id": "prod_002", "name": "Linen Blazer", "price": 120, "image": "/images/linen-blazer.jpg", "url": "/products/linen-blazer" }
      ],
      "banner": {
        "image": "/images/nav-banner-womens.jpg",
        "alt": "New summer collection",
        "url": "/collections/summer-2026",
        "headline": "Summer Collection",
        "cta": "Shop Now"
      }
    }
  },
  {
    "id": "mens",
    "label": "Men's",
    "url": "/collections/mens",
    "megaMenu": null
  },
  {
    "id": "accessories",
    "label": "Accessories",
    "url": "/collections/accessories",
    "megaMenu": {
      "columns": [
        {
          "heading": "Bags",
          "links": [
            { "label": "Totes", "url": "/collections/totes" },
            { "label": "Backpacks", "url": "/collections/backpacks" }
          ]
        }
      ],
      "featuredProducts": [],
      "banner": {
        "image": "/images/nav-banner-accessories.jpg",
        "alt": "New accessories arrivals",
        "url": "/collections/new-accessories",
        "headline": "New Arrivals",
        "cta": "Explore"
      }
    }
  }
]
