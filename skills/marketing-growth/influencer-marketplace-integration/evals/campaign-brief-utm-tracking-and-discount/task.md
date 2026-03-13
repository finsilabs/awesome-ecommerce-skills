# Influencer Campaign Onboarding System

## Problem/Feature Description

A direct-to-consumer skincare brand is running its first fully in-house influencer campaign — "Spring Glow" — after parting ways with their influencer agency. They have a list of 5 creators they want to onboard, and they need a system that generates the campaign brief structure, issues each creator a unique tracking link and discount code, and creates a participant record for each.

The brand's store lives at `https://glowbrand.com`. Campaign name is "Spring Glow". They want to use Instagram handles as the basis for identifying each creator's tracking artifacts wherever possible. The campaign runs from April 1 to April 30, 2026. Compensation is $500 flat per creator. Key messages are "lightweight formula", "dermatologist tested", and "suitable for all skin types". They require #ad and #sponsored disclosure on all posts.

The 5 creators to onboard are:

| Instagram handle | TikTok handle | Email |
|---|---|---|
| @glowwithsarah | @glowwithsarah_tt | sarah@example.com |
| @beautybypriya | @beautypriya | priya@example.com |
| @skincaredave | @skincare_dave | dave@example.com |
| @radiantrose | @radiant.rose | rose@example.com |
| @thefacemaven | @facemaven | maven@example.com |

## Output Specification

Produce a TypeScript file called `campaign-onboarding.ts` that:

1. Defines the campaign data structures (campaign and brief)
2. Contains a function that generates the tracking link and discount code for a given creator, using `https://glowbrand.com` as the store URL
3. Produces a JSON output file called `participants.json` with an array of 5 participant objects, one per creator, capturing their identity, their unique tracking artifacts, and their campaign onboarding state

Run the TypeScript file (using `ts-node` or `npx ts-node`) to actually generate `participants.json`, or alternatively write it as a plain `.js` file and run with Node.

Also produce a `brief-summary.md` file documenting the campaign brief — including the compensation structure, required disclosures, and key messages.
