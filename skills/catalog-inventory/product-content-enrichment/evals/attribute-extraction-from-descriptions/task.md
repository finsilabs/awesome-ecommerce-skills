# Product Attribute Backfill Tool

## Problem/Feature Description

HomeComforts, a home goods and furniture retailer, migrated to a new product information management (PIM) system last year. During the migration, the structured attribute fields (material composition, dimensions, care instructions, etc.) were lost for about 300 products — but those products still have rich marketing descriptions written by their copywriting team. Rather than manually filling in the attributes for hundreds of items, the data team wants to extract structured attributes from the existing descriptions automatically.

Your task is to write a Node.js script that reads the provided product descriptions and uses an AI model to extract a standard set of structured attributes from each one. The tool should handle edge cases gracefully: not all descriptions will contain every attribute, some descriptions may cause API errors, and the overall run should not fail just because a single product could not be processed. A clean JSON output file with the results should be left for the data team to review.

## Output Specification

Write a Node.js script `extract.js` that:

1. Reads the input product descriptions from `inputs/descriptions.json`
2. Calls an AI API to extract structured attributes from each description
3. Writes the results to `extracted_attributes.json` — one object per product, with the product id and the extracted attributes (only include attributes that were actually found; omit fields that are absent)
4. Prints a completion summary to stdout (e.g., how many succeeded, how many failed)

Also write a `design-notes.md` explaining the prompt design choices, the model and parameter selection, and how you handled missing attributes and parsing errors.

You do not need to execute the script — just write the code so the design can be reviewed.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/descriptions.json ===============
[
  {
    "id": "hg-001",
    "name": "Valencia Linen Duvet Cover",
    "description": "Crafted from 100% stonewashed linen, the Valencia Duvet Cover brings a relaxed, lived-in texture to any bedroom. The linen is sourced from European flax farms and woven in Portugal. Machine washable at 40°C, do not tumble dry. Dimensions: 200×200cm (double). The natural flax colour develops a softer patina with each wash. No warranty provided."
  },
  {
    "id": "hg-002",
    "name": "Oslo Solid Oak Dining Table",
    "description": "A minimalist dining table made from sustainably harvested solid oak with a natural oil finish. Seats 6 comfortably. Dimensions: 180cm L × 90cm W × 75cm H. Weight: 42kg. Wipe clean with a damp cloth; do not use abrasive cleaners. Manufactured in Denmark. Covered by a 5-year structural warranty."
  },
  {
    "id": "hg-003",
    "name": "Ember Ceramic Table Lamp",
    "description": "A hand-thrown ceramic lamp base in a warm terracotta glaze, paired with a linen drum shade. The cord is 1.8m and fitted with an inline dimmer switch. Wipe base with a dry cloth only. Shade dimensions: 30cm diameter × 20cm height."
  },
  {
    "id": "hg-004",
    "name": "CloudSoft Bamboo Bath Towel",
    "description": "Woven from 70% bamboo viscose and 30% cotton, this bath towel is exceptionally soft and quick-drying. Weight: 500gsm. Available in ivory, sage, and slate. Machine washable at 40°C; tumble dry on low. Size: 70×140cm. Made in Turkey."
  },
  {
    "id": "hg-005",
    "name": "Meridian Wool Throw",
    "description": "A generously sized throw blanket in a classic herringbone weave. Made in Scotland from 100% lambswool. Hand wash cold or dry clean only. Dimensions: 130×200cm. Weight: 800g. The earthy tones — ochre, rust, and cream — are achieved using natural plant dyes."
  },
  {
    "id": "hg-006",
    "name": "Apex Standing Desk Frame",
    "description": "An electric height-adjustable desk frame compatible with tops from 120–200cm wide. Steel construction with a powder-coat finish. Height range: 62–128cm. Lifting capacity: 80kg. Ships in two boxes, total weight: 28kg. Assembly required. Comes with a 3-year motor warranty."
  },
  {
    "id": "hg-007",
    "name": "Petra Marble Cheese Board",
    "description": "A solid white Carrara marble serving board, ideal for charcuterie and cheese. Dimensions: 35×25cm, 2cm thick. Weight: 1.8kg. Wipe clean with a damp cloth; do not submerge in water or put in the dishwasher."
  },
  {
    "id": "hg-008",
    "name": "Serenity Scented Soy Candle",
    "description": "Hand-poured in small batches using 100% soy wax and a cotton wick. Scented with a blend of cedarwood and bergamot essential oils. Burn time approximately 45 hours. Net weight: 220g. Keep away from drafts and never leave unattended while burning."
  }
]
