# Mobile Navigation Drawer for a Storefront Mega Menu

## Problem/Feature Description

A sportswear brand's desktop site has a working mega menu, but their mobile experience is broken. On phones, the full-width hover panels don't work (touch events differ from hover events), and the current fallback just hides the navigation entirely. Analytics show that over 60% of traffic is on mobile, so the team needs a proper mobile navigation drawer before their next product launch.

The solution should be a side drawer that slides in when a hamburger button is tapped. Inside the drawer, categories that have sub-links should expand accordion-style when tapped. When the drawer is open, users should not be able to accidentally interact with content behind it. The tech lead has also asked that the CSS for the desktop mega panel be updated so it is fully hidden at the mobile breakpoint, since the drawer replaces it entirely.

## Output Specification

Produce the following files:

- `MobileNav.jsx` — the mobile navigation drawer component
- `mega-panel.css` — CSS that includes the desktop mega panel styles AND the responsive rule that hides it on small screens; also include any body-level styles needed when the drawer is open
- `implementation-notes.md` — a short document describing how focus management works in the drawer and how body scroll is handled when the drawer is open

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/nav-data-sample.json ===============
[
  {
    "id": "running",
    "label": "Running",
    "url": "/collections/running",
    "megaMenu": {
      "columns": [
        {
          "heading": "Men's Running",
          "links": [
            { "label": "Shorts", "url": "/collections/mens-running-shorts" },
            { "label": "Tops", "url": "/collections/mens-running-tops" },
            { "label": "Shoes", "url": "/collections/mens-running-shoes" }
          ]
        },
        {
          "heading": "Women's Running",
          "links": [
            { "label": "Leggings", "url": "/collections/womens-leggings" },
            { "label": "Sports Bras", "url": "/collections/sports-bras" },
            { "label": "Shoes", "url": "/collections/womens-running-shoes" }
          ]
        }
      ],
      "featuredProducts": [],
      "banner": null
    }
  },
  {
    "id": "training",
    "label": "Training",
    "url": "/collections/training",
    "megaMenu": {
      "columns": [
        {
          "heading": "Equipment",
          "links": [
            { "label": "Weights", "url": "/collections/weights" },
            { "label": "Resistance Bands", "url": "/collections/bands" }
          ]
        }
      ],
      "featuredProducts": [],
      "banner": null
    }
  },
  {
    "id": "sale",
    "label": "Sale",
    "url": "/collections/sale",
    "megaMenu": null
  }
]
