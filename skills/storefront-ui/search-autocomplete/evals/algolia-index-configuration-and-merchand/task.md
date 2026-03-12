# Algolia Search Index Setup for Product Catalog

## Problem/Feature Description

A home goods retailer is migrating from a legacy keyword-only search to Algolia. They have a large product catalog (200k SKUs across categories like furniture, kitchen, bedding, and lighting) and have noticed two recurring problems: shoppers searching for "sofa" don't see "couch" results, and shoppers with minor typos (e.g., "lighitng") get zero results. In addition, the merchandising team wants to ensure that newly featured seasonal products appear at the top of search results for relevant queries, and that in-demand items are ranked above obscure catalog entries.

There is also a known business rule: when a shopper searches for anything containing the word "sale", the "Summer Sale Collection" (objectID: `collection-summer-sale`) should be pinned to position 0. The team has been burned before by using exact-match conditions in rules that silently failed for queries like "big sale" or "sale items".

Your task is to write the Algolia configuration scripts that set up the `products` index from scratch and save the required merchandising rule. The scripts will be run by the DevOps team using Node.js — they will provide the `ALGOLIA_APP_ID` and `ALGOLIA_ADMIN_KEY` environment variables.

## Output Specification

Produce the following files:
- `configure-index.js` — script to configure the products index settings (searchable attributes, ranking, typo tolerance, synonyms)
- `configure-rules.js` — script to save merchandising rules for the products index
- `README.md` — brief notes explaining what each script does and the order to run them
