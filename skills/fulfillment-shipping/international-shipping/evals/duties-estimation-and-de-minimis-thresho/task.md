# International Duties Estimation at Checkout

## Problem/Feature Description

TradeWave, an online marketplace, is expanding to serve customers in the UK, Germany, France, Australia, Canada, Japan, and Mexico. The checkout team has been asked to show customers the estimated duties and taxes before they place an order — a key requirement for the "landed cost" feature the product team wants to launch next quarter.

The team is aware that small, low-value orders in many countries are often fully exempt from import duties, and they want the checkout experience to reflect this: if an order qualifies for the duty-free exemption in the destination country, no duty estimate should be shown or added to the order total. The carrier integration currently being used for rate shopping and label creation is EasyPost, and the engineering team would like the duties estimation to be consistent with that platform. The team also needs a reliable fallback path in case the live estimation service is unavailable — but the fallback must not cause the checkout to error out for customers.

## Output Specification

Produce a single TypeScript file `duties-estimation.ts` containing:

1. A `DutyEstimation` TypeScript interface capturing all fields returned by the estimation
2. A `DE_MINIMIS_CENTS` constant mapping destination country codes to their duty-free thresholds
3. An `exceedsDeMinimisCents(totalValueCents, destinationCountry)` helper function
4. An `estimateDutiesAndTaxes(orderLines, destinationCountry, destinationZip)` async function that calls EasyPost for live estimates and falls back gracefully if the API is unavailable

Also produce a `checkout-integration.md` (max 20 lines) explaining how the de minimis check should be integrated into the checkout flow and what to show the customer in each case.
