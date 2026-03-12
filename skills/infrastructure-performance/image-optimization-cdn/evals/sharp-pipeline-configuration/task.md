# Batch Image Processor for Product Catalog

## Problem/Feature Description

A fashion retailer is migrating their product catalog to a new headless storefront. Their merchandising team has uploaded thousands of original product photos — high-resolution JPEGs and PNGs supplied by vendors, many between 3–15 MB. Before these can be served on the storefront, they need to be converted into web-optimized variants at multiple sizes.

The engineering team needs a standalone Node.js/TypeScript utility that processes a directory of input images and produces optimized output variants. The utility must handle JPEG, PNG, BMP, and TIFF source files and output versions in both WebP and JPEG format. The tool will be run as part of a CI pipeline on a Linux x86-64 build server.

## Output Specification

Produce the following files:

- `package.json` — project manifest with correct dependency configuration for Node.js
- `src/image-processor.ts` — the core image processing module with the transformation logic and exported size constants
- `src/batch-process.ts` — CLI script that reads from an `inputs/` directory and writes processed images to `outputs/`
- `README.md` — brief usage instructions including how to install and run

The batch processor should, for each source image, produce output files at multiple standard sizes in both WebP and JPEG format. Name output files to indicate their size variant (e.g., `product-name_400w.webp`).

Do not leave large generated image files on disk after running — the script itself is the deliverable, not sample output.

## Input Files

The following sample images are provided for testing. Extract them before beginning.

=============== FILE: inputs/sample-red.jpg ===============
(placeholder — agent should treat this as a JPEG file stub for testing)
