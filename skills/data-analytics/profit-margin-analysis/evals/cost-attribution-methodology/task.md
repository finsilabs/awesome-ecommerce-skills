# SKU Cost Attribution Module for an Ecommerce Analytics Platform

## Problem / Feature Description

A boutique analytics consultancy is building a Python-based cost attribution module for an ecommerce client that sells on both their own website (via Stripe) and Amazon FBA. The client imports goods from overseas suppliers and ships them in custom-sized boxes. Until now, the team has been using the supplier invoice price as the product cost and ignoring most variable costs, which is causing their reported margins to look far higher than actual bank account reality.

The consultancy wants a clean Python module that correctly computes fully-loaded per-unit costs: the true product cost (not just the invoice), shipping costs for each order line item based on package dimensions and zone, payment processing fees for direct-channel orders, and Amazon fees parsed from a settlement report. All cost attribution decisions should be documented in the module so another analyst can review and reproduce the work.

You are implementing the core calculations. The client ships packages via UPS and FedEx ground, and uses Stripe for all web orders.

## Output Specification

Produce a Python file named `cost_attribution.py` containing:

1. A function that calculates landed cost per unit given invoice price and additional cost components (freight, duties, inspection, prep)
2. A function that estimates outbound shipping cost per shipment given package dimensions (in inches), weight (in ounces), destination zone, and a carrier rate table dictionary
3. A function that calculates the Stripe payment processing fee for a transaction amount
4. A function that extracts and aggregates Amazon fees from a list of settlement line items (each item is a dict with at least `sku`, `fee_type`, and `amount` keys)
5. A brief `ASSUMPTIONS` string constant at the top of the file documenting the cost attribution decisions embedded in the code

Include a short `if __name__ == "__main__"` block with one worked example of each function so the output can be verified by running `python cost_attribution.py`.

## Input Files

The following sample Amazon settlement data is provided as a reference for what the settlement line items look like. Extract it before beginning.

=============== FILE: inputs/sample_settlement.json ===============
[
  {"sku": "WIDGET-RED-L", "fee_type": "Commission", "amount": -4.50},
  {"sku": "WIDGET-RED-L", "fee_type": "FBAPerUnitFulfillmentFee", "amount": -3.22},
  {"sku": "WIDGET-RED-L", "fee_type": "Principal", "amount": 29.99},
  {"sku": "WIDGET-BLUE-M", "fee_type": "Commission", "amount": -3.90},
  {"sku": "WIDGET-BLUE-M", "fee_type": "FBAPerUnitFulfillmentFee", "amount": -2.98},
  {"sku": "WIDGET-BLUE-M", "fee_type": "Principal", "amount": 25.99},
  {"sku": "WIDGET-RED-L", "fee_type": "VariableClosingFee", "amount": -1.80},
  {"sku": "WIDGET-BLUE-M", "fee_type": "VariableClosingFee", "amount": -1.80}
]
