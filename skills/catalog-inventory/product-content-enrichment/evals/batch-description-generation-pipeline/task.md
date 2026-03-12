# Outdoor Gear Product Description Generator

## Problem/Feature Description

OutdoorPeak, a mid-size outdoor retailer, has just received a supplier data export containing 12 new products — hiking boots, insulated jackets, and trekking poles — that need to be added to their website before a weekend sale. The supplier data is minimal: product names, SKUs, categories, and a few raw attributes (material, weight, dimensions), but no marketing copy. The content team has written brand voice guidelines emphasizing a confident, adventure-focused tone without overblown marketing language.

The team needs a Node.js script that reads the supplied product data and calls an AI API to generate polished product descriptions in bulk. Because the AI sometimes produces unreliable copy, the marketing team insists that all generated descriptions be held for their review before going live — they do not want anything published automatically. The script should handle failures gracefully so that a problem with one product does not stop descriptions from being generated for the rest.

## Output Specification

Produce a single Node.js script file named `enrich.js` (or split across files in a `lib/` directory) that:

1. Accepts the input product list (provided below) and generates a description for each product using an AI API
2. Prints a summary to stdout showing how many succeeded and how many failed
3. Writes a file `drafts.json` containing each product's generated description alongside a `status` field

You may use any approach to structure the code, but the output file `drafts.json` must exist after the script is run (you do not need to actually execute it — just write the code).

Also write a brief `design-notes.md` explaining the key design decisions you made for the prompt, the batch logic, and the draft-saving approach.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod-001",
    "name": "TrailBlaze Hiking Boot",
    "category": "Footwear",
    "attributes": {
      "material": "Full-grain leather upper, Vibram sole",
      "weight": "680g per boot",
      "waterproofing": "Gore-Tex membrane",
      "ankle_support": "High-cut"
    },
    "seoKeywords": ["waterproof hiking boots", "trail boots"]
  },
  {
    "id": "prod-002",
    "name": "SummitShield Insulated Jacket",
    "category": "Outerwear",
    "attributes": {
      "material": "600-fill goose down, ripstop nylon shell",
      "weight": "420g",
      "packable": "Packs into own pocket",
      "temperature_rating": "-10°C"
    },
    "seoKeywords": ["down jacket", "packable insulated jacket"]
  },
  {
    "id": "prod-003",
    "name": "AlpinePro Trekking Poles",
    "category": "Equipment",
    "attributes": {
      "material": "7075 aluminium",
      "weight": "280g per pole",
      "adjustable_range": "110–135cm",
      "grip": "Cork grip with neoprene extension"
    },
    "seoKeywords": ["trekking poles", "adjustable hiking poles"]
  },
  {
    "id": "prod-004",
    "name": "RidgeLine Softshell Pants",
    "category": "Apparel",
    "attributes": {
      "material": "92% polyester, 8% elastane",
      "weight": "310g",
      "articulation": "Articulated knees",
      "pockets": "4 zip pockets"
    },
    "seoKeywords": ["softshell hiking pants", "stretch outdoor pants"]
  },
  {
    "id": "prod-005",
    "name": "CampLight Headlamp 350",
    "category": "Lighting",
    "attributes": {
      "lumens": "350 lm max",
      "battery": "3× AAA (included)",
      "weight": "89g (with batteries)",
      "beam_distance": "80m"
    },
    "seoKeywords": ["headlamp", "camping headlamp"]
  },
  {
    "id": "prod-006",
    "name": "NordicTrack Merino Base Layer",
    "category": "Apparel",
    "attributes": {
      "material": "100% merino wool, 200gsm",
      "weight": "220g",
      "odor_resistance": "Natural merino properties",
      "fit": "Slim fit"
    },
    "seoKeywords": ["merino base layer", "wool thermal top"]
  },
  {
    "id": "prod-007",
    "name": "PeakBag 40L Daypack",
    "category": "Bags & Packs",
    "attributes": {
      "material": "420D nylon",
      "volume": "40 litres",
      "weight": "950g",
      "back_system": "Adjustable torso length, ventilated panel"
    },
    "seoKeywords": ["40L daypack", "hiking backpack"]
  },
  {
    "id": "prod-008",
    "name": "GlacierGrip Waterproof Gloves",
    "category": "Accessories",
    "attributes": {
      "material": "Goat leather palm, fleece lining",
      "waterproofing": "Gore-Tex insert",
      "insulation": "PrimaLoft Gold 100g"
    },
    "seoKeywords": ["waterproof gloves", "ski gloves"]
  },
  {
    "id": "prod-009",
    "name": "HighCamp Sleeping Bag -5°C",
    "category": "Sleep",
    "attributes": {
      "fill": "550-fill duck down",
      "temperature_rating": "-5°C comfort",
      "weight": "1.1kg",
      "packed_size": "28×18cm"
    },
    "seoKeywords": ["3-season sleeping bag", "down sleeping bag"]
  },
  {
    "id": "prod-010",
    "name": "TerraFirm Gaiters",
    "category": "Footwear Accessories",
    "attributes": {
      "material": "Cordura nylon",
      "height": "40cm",
      "closure": "YKK zip + velcro",
      "compatibility": "Fits most hiking boots"
    },
    "seoKeywords": ["hiking gaiters", "trail gaiters"]
  },
  {
    "id": "prod-011",
    "name": "SolarSip Water Filter Bottle",
    "category": "Hydration",
    "attributes": {
      "capacity": "650ml",
      "filter_type": "Hollow-fibre membrane",
      "filtration_rating": "0.1 micron (removes bacteria & protozoa)",
      "weight": "148g"
    },
    "seoKeywords": ["filtered water bottle", "hiking water filter"]
  },
  {
    "id": "prod-012",
    "name": "StormProof Bivvy Bag",
    "category": "Shelter",
    "attributes": {
      "material": "Aluminium-coated polyester",
      "weight": "120g",
      "packed_size": "10×6cm",
      "use_case": "Emergency shelter, reflects 90% body heat"
    },
    "seoKeywords": ["bivvy bag", "emergency shelter"]
  }
]
