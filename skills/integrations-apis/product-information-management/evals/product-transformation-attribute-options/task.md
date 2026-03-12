# Product Enrichment Pipeline for Headless Storefront

## Problem/Feature Description

A fashion retailer is launching a new headless storefront backed by Akeneo PIM. Their catalog has attributes like `color`, `size`, `material`, and `country_of_origin` stored as select-list option codes (e.g., `color: "CLR_BLU"` instead of `"Blue"`). They also have localized attributes — descriptions exist in multiple locales and are scoped to different sales channels. Without correct transformation, the storefront will display cryptic codes instead of readable labels, and products missing key content will slip through to production.

The team needs a TypeScript data pipeline that takes raw Akeneo product payloads and transforms them into clean storefront-ready objects. The pipeline must resolve attribute option codes to human-readable labels (loading options from Akeneo and caching them), flatten localized/scoped attribute values correctly, validate that products meet minimum content requirements before passing them downstream, and filter out incomplete products using Akeneo's own completeness data.

## Output Specification

Produce a TypeScript implementation with the following files:

- `lib/akeneo/product-transformer.ts` — transformation logic including locale/scope resolution
- `lib/akeneo/attribute-options.ts` — attribute option loader and label resolver
- `lib/akeneo/pipeline.ts` — the pipeline that loads options, validates products, and transforms them

Include a `pipeline-design.md` that explains the key design decisions in your pipeline: how multi-locale/multi-scope attribute values are resolved, how attribute option labels are loaded and made available to the transformer, and what quality checks are applied before a product is passed downstream.

## Input Files

The following representative Akeneo API payloads are provided as reference data. Extract them before beginning.

=============== FILE: inputs/sample-products.json ===============
[
  {
    "identifier": "SHIRT-001",
    "family": "shirts",
    "enabled": true,
    "categories": ["summer_collection", "mens"],
    "updated": "2026-03-10T14:00:00+00:00",
    "values": {
      "name": [
        {"locale": "en_US", "scope": null, "data": "Classic Oxford Shirt"},
        {"locale": "fr_FR", "scope": null, "data": "Chemise Oxford Classique"}
      ],
      "description": [
        {"locale": "en_US", "scope": "ecommerce", "data": "A timeless Oxford shirt crafted from premium cotton."},
        {"locale": "en_US", "scope": "print", "data": "Premium Oxford shirt for print catalog."}
      ],
      "color": [{"locale": null, "scope": null, "data": "CLR_BLU"}],
      "size": [{"locale": null, "scope": null, "data": "SZ_M"}],
      "material": [{"locale": null, "scope": null, "data": "MAT_COT"}],
      "images": [{"locale": null, "scope": null, "data": "abc123.jpg"}]
    },
    "completeness": {"ecommerce": 100, "print": 85}
  },
  {
    "identifier": "SHIRT-002",
    "family": "shirts",
    "enabled": true,
    "categories": ["summer_collection"],
    "updated": "2026-03-11T09:00:00+00:00",
    "values": {
      "name": [{"locale": "en_US", "scope": null, "data": ""}],
      "description": [{"locale": "en_US", "scope": "ecommerce", "data": "A lightweight linen shirt."}],
      "color": [{"locale": null, "scope": null, "data": "CLR_WHT"}],
      "size": [{"locale": null, "scope": null, "data": "SZ_L"}]
    },
    "completeness": {"ecommerce": 60, "print": 40}
  }
]

=============== FILE: inputs/sample-attribute-options.json ===============
{
  "color": [
    {"code": "CLR_BLU", "labels": {"en_US": "Blue", "fr_FR": "Bleu"}},
    {"code": "CLR_WHT", "labels": {"en_US": "White", "fr_FR": "Blanc"}}
  ],
  "size": [
    {"code": "SZ_M", "labels": {"en_US": "Medium"}},
    {"code": "SZ_L", "labels": {"en_US": "Large"}}
  ],
  "material": [
    {"code": "MAT_COT", "labels": {"en_US": "Cotton", "fr_FR": "Coton"}}
  ]
}
