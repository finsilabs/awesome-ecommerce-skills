# Fashion Catalog Image Enrichment & Moderation System

## Problem/Feature Description

StyleHaus, an online fashion retailer, recently completed a photography session for their new spring collection — 200 product images uploaded to their CDN. Their accessibility team has flagged that most images are missing alt text, which is a legal compliance issue. Separately, the merchandising team needs structured color and material tags on images to power their visual search and filter features ("shop by color", "filter by fabric"). Manually tagging 200 images would take days.

The tech team wants to build an automated image enrichment pipeline that uses an AI vision model to generate alt text and structured tags for each image. However, past experience with AI-generated copy has taught them a hard lesson: AI sometimes hallucinates product details. Any AI-generated content must go through a moderation queue before it is applied to live product listings. Reviewers need endpoints to browse pending items and approve or reject them. The team also wants to avoid wasting API credits on unusable low-resolution images.

Your task is to implement the image tagging service and the moderation workflow. Use the public image URLs provided below as sample inputs.

## Output Specification

Write a Node.js implementation (one or more files) that includes:

1. An `tagImage(imageUrl, existingAltText)` function that calls an AI vision API and returns structured tagging data
2. A `processImageBatch(images)` function that tags a list of images and saves the results to a pending review state
3. HTTP route handlers (or a simple Express router) for:
   - Listing pending image tag drafts
   - Approving a draft (applying tags to the image record)
   - Rejecting a draft with an optional note
4. A `design-notes.md` file explaining your prompt design, the model and parameter choices, how you handle the case where an image already has manually-written alt text, and your approach to the moderation workflow

You do not need to run or deploy the code — provide the implementation files for review. Use in-memory data structures (plain JS objects/Maps) instead of a real database so the code can be understood without infrastructure.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/images.json ===============
[
  {
    "id": "img-001",
    "productId": "prod-101",
    "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "altText": null,
    "width": 800,
    "height": 533
  },
  {
    "id": "img-002",
    "productId": "prod-102",
    "url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800",
    "altText": "Classic silver watch on white background",
    "width": 800,
    "height": 800
  },
  {
    "id": "img-003",
    "productId": "prod-103",
    "url": "https://images.unsplash.com/photo-1594938298603-c8148c4b4e02?w=800",
    "altText": null,
    "width": 800,
    "height": 1067
  },
  {
    "id": "img-004",
    "productId": "prod-104",
    "url": "https://images.unsplash.com/photo-1602810316693-3667c854239a?w=300",
    "altText": null,
    "width": 300,
    "height": 300
  },
  {
    "id": "img-005",
    "productId": "prod-105",
    "url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
    "altText": null,
    "width": 800,
    "height": 1200
  }
]
