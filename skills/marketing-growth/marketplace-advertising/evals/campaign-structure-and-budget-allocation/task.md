# Amazon Sponsored Products Campaign Setup

## Problem/Feature Description

A small home goods brand just launched a new stainless steel travel mug on Amazon (ASIN: B0EXAMPLE123) and needs to start advertising. The brand manager has heard that a structured approach to Sponsored Products works better than a single campaign, but doesn't know how to set it up programmatically. They have the Amazon Advertising API credentials already registered in the console, and want a TypeScript module that creates the complete initial campaign structure for the product.

The brand operates in the North America marketplace, has a daily advertising budget of $50, and has identified initial seed keywords: "stainless steel travel mug", "insulated coffee tumbler", and "leak proof travel cup". They want the setup to be production-ready with proper authentication handling and structured so that it can easily discover new keywords over time while maintaining controlled spending on proven terms.

## Output Specification

Write a TypeScript file named `campaign-setup.ts` that:
- Defines the Amazon Ads API configuration interface and authentication
- Implements a function to create the full campaign structure for the ASIN above
- Creates all necessary campaigns, ad groups, product ads, and keywords
- Is ready to be called with the provided parameters

The file should be self-contained and use only standard Node.js/TypeScript patterns with `fetch` for HTTP calls. No additional libraries beyond `date-fns` for date formatting are needed.
