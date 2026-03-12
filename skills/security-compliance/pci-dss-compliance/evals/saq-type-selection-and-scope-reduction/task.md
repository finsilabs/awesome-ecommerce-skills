# Payment Compliance Scope Analysis for ShopFast

## Problem/Feature Description

ShopFast is a mid-size online retailer that has been processing payments by passing card numbers through their own server to their payment gateway. Their compliance officer has just flagged that they are undergoing an acquisition due diligence process and the buyer is asking for a PCI-DSS compliance status report. The engineering team has been tasked with preparing a technical memo that outlines their current compliance posture and proposes a path to reduced compliance scope.

The team is evaluating three possible payment integration approaches, each with different implications for how card data flows through ShopFast's infrastructure. They want to understand what PCI SAQ (Self-Assessment Questionnaire) type each approach would qualify them for, and they want a concrete recommendation for which approach minimizes their ongoing compliance burden. The recommendation needs to include a rationale that a non-technical compliance officer can understand.

## Output Specification

Produce a compliance analysis document named `pci_scope_analysis.md` that covers:

1. An evaluation of the following three payment integration patterns, with the SAQ type that applies to each and the approximate number of controls required:
   - Approach A: Redirect customers to a fully hosted payment page provided by the processor (the processor hosts the entire payment form on their domain)
   - Approach B: Embed a payment form built with the processor's JavaScript SDK directly on your checkout page (your page loads JS from the processor and it collects card details in an iframe)
   - Approach C: Collect card numbers on your own form and POST them to your backend, which then calls the processor API

2. A clear recommendation for which approach ShopFast should adopt going forward, with reasoning.

3. A short code sketch (TypeScript or pseudocode is fine) showing how the recommended integration approach would be initialised at the server side.

4. A summary of what SAQ controls ShopFast would still need to satisfy under the recommended approach.
