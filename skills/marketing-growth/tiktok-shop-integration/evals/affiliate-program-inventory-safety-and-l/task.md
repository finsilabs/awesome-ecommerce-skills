# TikTok Shop Launch Playbook & Affiliate Setup

## Problem/Feature Description

LuxeCandle Co. is preparing to launch its entire product range on TikTok Shop ahead of the holiday season. The head of e-commerce has asked for two things: (1) a TypeScript module that configures the affiliate creator program for the catalogue — both a broad "discovery" tier open to any creator and a VIP tier for a shortlist of hand-picked influencers — and (2) a concise operational playbook (`PLAYBOOK.md`) that the team can follow for the launch, covering inventory management, fulfilment targets, and content strategy.

The brand has had problems with overselling on other marketplaces in the past, especially during flash sales, and the CTO has specifically asked that the inventory architecture section of the playbook address how to prevent TikTok Shop from accepting orders it can't fulfil. The marketing director wants guidance on how to maximise reach for the new "Winter Collection" drop without spending heavily on paid ads, and needs specific advice on image assets to prepare to avoid products getting stuck in review.

## Output Specification

Produce two files:

1. `affiliate-setup.ts` — TypeScript module with:
   - A function to set an open-collaboration commission rate on a list of product IDs
   - A function to invite a specific creator (by their unique ID) to a targeted affiliate campaign with a set of product IDs

2. `PLAYBOOK.md` — Operational launch playbook with sections covering:
   - Inventory management and oversell prevention strategy
   - Order fulfilment targets and consequences of missing them
   - Content / go-to-market strategy for the new product launch
   - Affiliate program management and brand safety guidelines
   - Product image requirements to pass TikTok catalog review
   - Shipping cost configuration guidance
