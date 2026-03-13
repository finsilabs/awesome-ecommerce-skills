# iOS Attribution Setup and Retargeting Audience Export for AppLovin

## Problem/Feature Description

StyleDrop, a fashion commerce app, has been running AppLovin user acquisition campaigns but their ROAS reports are showing wildly inaccurate revenue numbers and the attribution team can't figure out why. Additionally, the marketing team wants to set up a retargeting campaign focused on users who abandoned their cart. The iOS engineering team needs to fix the attribution pipeline and prepare the retargeting audience export.

The engineering team knows they need to implement SKAdNetwork conversion value tracking properly on iOS, including support for both newer and older iOS versions. They also need to export the right segment of users from the database for the retargeting audience upload. The campaign manager also needs a written campaign configuration guide for the user acquisition and retargeting campaigns, covering bid strategy, budget, targeting demographics, geographic focus, and frequency controls.

## Output Specification

Produce the following files:

- `skan-tracker.swift` — A Swift utility that updates SKAdNetwork conversion values based on purchase order value, supporting both iOS 16.1+ (SKAdNetwork 4.0) and older iOS versions
- `retargeting-export.ts` — A TypeScript script that queries a database for the correct retargeting audience and returns/exports records in the format expected by AppLovin Audience Manager
- `campaign-guide.md` — A configuration guide covering: user acquisition campaign bid strategy and budget, geographic targeting, age targeting, the correct timing for calling the SKAN conversion value update relative to the purchase flow, frequency capping for retargeting, and any additional AppLovin platform configuration steps needed for accurate attribution reporting

## Input Files (optional)

No additional files will be provided. The database schema can be assumed to have a table `app_users` with fields: `id`, `advertisingId` (GAID), `idfaHash`, `email`, `lastOpenedAt`, `hasPlacedOrder`, `hasAddedToCart`.
