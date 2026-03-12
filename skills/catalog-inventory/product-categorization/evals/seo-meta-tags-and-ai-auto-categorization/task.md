# SEO Boost and Bulk Catalog Import for an Outdoor Gear Store

## Problem/Feature Description

TrailPeak is an outdoor gear retailer that has seen its organic search traffic plateau. A web performance audit found two root causes: (1) category pages lack proper structured data and have inconsistent meta tags that cause Google to generate its own titles and descriptions; (2) a recent partnership with a large equipment supplier added 4,000 raw products that are still sitting unorganized in a staging table because manually assigning them to categories would take weeks.

The engineering team wants to fix both problems in a single sprint. For SEO, every category page needs a well-structured meta tag set including an explicit canonical URL, Open Graph tags, and JSON-LD structured data that search engines can parse for rich results. For the bulk import, they want an automated first pass that places each raw product into the most likely categories, with a lightweight review step so the merchandising team can spot-check edge cases before they go live.

## Output Specification

Produce the following files:

1. `lib/categorySeo.js` (or `.ts`) — A function `getCategoryMeta(category, productCount)` that returns an object with meta title, description, canonical URL, openGraph tags, and JSON-LD structured data for a given category.

2. `lib/autoCategorize.js` (or `.ts`) — A function `suggestCategories(product, categoryTree)` that uses an LLM to suggest the most appropriate categories for a product given the available category tree.

3. `categorize-batch.js` (or `.ts`) — A runnable script that:
   - Reads products from the provided `inputs/products.json`
   - For each product, calls `suggestCategories` and records the results
   - Writes `output/categorization-results.json` with each product's suggested category IDs and a field indicating whether human review is needed
   - Includes inline comments explaining the review criteria

You do not need to make live API calls — stub or mock the LLM calls. The logic, prompts, parameters, and data structures should be clearly visible in the code.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod_001",
    "title": "Merino Wool Base Layer Top",
    "description": "Lightweight 150gsm merino wool long-sleeve top, ideal for hiking and backpacking in variable conditions. Odor-resistant, moisture-wicking, machine washable."
  },
  {
    "id": "prod_002",
    "title": "10L Ultralight Daypack",
    "description": "Minimalist 10-liter pack for day hikes and trail running. Includes hydration sleeve, trekking pole loops, and reflective strips. Weighs 280g."
  },
  {
    "id": "prod_003",
    "title": "Titanium Camping Cookset",
    "description": "Two-piece titanium pot and pan set with folding handles. Suitable for backpacking stoves. Total weight 220g, fits 2 persons."
  }
]

=============== FILE: inputs/category-tree.json ===============
[
  {
    "id": "cat_clothing", "name": "Clothing", "slug": "clothing", "path": "clothing", "depth": 0, "children": [
      { "id": "cat_base", "name": "Base Layers", "slug": "base-layers", "path": "clothing/base-layers", "depth": 1, "children": [] },
      { "id": "cat_mid", "name": "Mid Layers", "slug": "mid-layers", "path": "clothing/mid-layers", "depth": 1, "children": [] }
    ]
  },
  {
    "id": "cat_packs", "name": "Packs & Bags", "slug": "packs-bags", "path": "packs-bags", "depth": 0, "children": [
      { "id": "cat_daypacks", "name": "Daypacks", "slug": "daypacks", "path": "packs-bags/daypacks", "depth": 1, "children": [] },
      { "id": "cat_overnight", "name": "Overnight Packs", "slug": "overnight-packs", "path": "packs-bags/overnight-packs", "depth": 1, "children": [] }
    ]
  },
  {
    "id": "cat_camp", "name": "Camp & Hike", "slug": "camp-hike", "path": "camp-hike", "depth": 0, "children": [
      { "id": "cat_cooking", "name": "Cooking & Nutrition", "slug": "cooking-nutrition", "path": "camp-hike/cooking-nutrition", "depth": 1, "children": [] }
    ]
  }
]
