# FAQ and Testimonials Content System for Shopify Theme

## Problem/Feature Description

StyleHouse is a Shopify fashion brand that manages their FAQ and customer testimonials content through their development team. Both types of content have multiple distinct fields: FAQs have a question and a detailed answer; testimonials have a customer name, quote, rating (1-5), and an optional product reference. Currently both are stored as hard-coded HTML in theme sections, which means content editors cannot update them without a developer.

The product manager wants both content types to be editable in the Shopify Admin UI by non-technical staff, and for the data to be rendered in two theme sections via Liquid. They specifically want to avoid building a separate CMS or storing everything as a single blob of JSON in one metafield, which would make the individual fields un-editable in the admin.

You've been asked to write:
1. A TypeScript setup script that creates the data structures and populates initial content entries using the provided seed data
2. A Liquid snippet for rendering FAQs on a page
3. A Liquid snippet for rendering testimonials

The script should output a dry-run log to stdout showing what mutations it would call (no live API calls needed). Use the provided seed data to populate the initial entries.

## Output Specification

- `setup-content.ts` — TypeScript script that creates the type definitions and entries for both FAQs and testimonials from the seed data, with dry-run logging to stdout
- `dry-run-log.txt` — The stdout output from running the script, showing the mutation names and at least one example payload for each mutation type
- `sections/faq.liquid` — Liquid snippet rendering FAQ entries from shop metafields
- `sections/testimonials.liquid` — Liquid snippet rendering testimonial entries from shop metafields
- `content-schema.md` — Documents the type names, field keys and types for both content structures

## Input Files

The following seed data is provided. Extract it before beginning.

=============== FILE: inputs/faqs.json ===============
[
  {
    "question": "What is your return policy?",
    "answer": "We accept returns within 30 days of purchase. Items must be unworn with original tags attached. Sale items are final sale.",
    "sort_order": 1
  },
  {
    "question": "Do you offer international shipping?",
    "answer": "Yes, we ship to over 40 countries. International orders typically arrive within 7-14 business days. Import duties are the responsibility of the customer.",
    "sort_order": 2
  },
  {
    "question": "How do I find my size?",
    "answer": "Use our size guide available on every product page. We recommend measuring your chest, waist, and hips and comparing to our size chart. When in doubt, size up.",
    "sort_order": 3
  },
  {
    "question": "Are your products ethically made?",
    "answer": "All our manufacturing partners are certified by the Fair Trade Foundation. We publish our full supplier list annually on our sustainability page.",
    "sort_order": 4
  },
  {
    "question": "Can I modify or cancel my order?",
    "answer": "Orders can be modified or cancelled within 2 hours of placement by contacting our support team. After that, orders enter fulfillment and cannot be changed.",
    "sort_order": 5
  }
]

=============== FILE: inputs/testimonials.json ===============
[
  {
    "customer_name": "Sarah M.",
    "quote": "The quality is outstanding. I've been a customer for three years and every piece has lasted beautifully.",
    "rating": 5
  },
  {
    "customer_name": "James T.",
    "quote": "Sizing is true to chart and the fabric feels premium. Delivery was faster than expected.",
    "rating": 5
  },
  {
    "customer_name": "Priya K.",
    "quote": "Love the sustainable packaging. The coat I ordered is exactly as pictured and incredibly warm.",
    "rating": 4
  },
  {
    "customer_name": "Marcus B.",
    "quote": "Customer service resolved my exchange quickly and without hassle. Will definitely order again.",
    "rating": 5
  }
]
