# Early Payment Discount Engine

## Problem/Feature Description

FinFlow Wholesale offers several payment terms with early payment discount (EPD) options — for example, a customer on "2/10 net-30" terms can deduct 2% from their invoice if they pay within 10 days, otherwise the full amount is due in 30 days. The CFO wants two things from the engineering team.

First, the accounts receivable team is processing payments manually and keeps accepting discounts from customers who pay after the discount window has closed. The team needs a function that, given an invoice and a proposed payment date, calculates whether a discount applies and what the customer actually owes — so the AR clerk can stop making judgment calls.

Second, the CFO has been trying to convince the sales team that offering 2/10 net-30 is actually very expensive financing for customers who don't take the discount. She wants a utility function that, for any discount-bearing payment terms code, computes the annualized cost of the credit so she can use it in conversations with customers and in the company's pricing model. She suspects that most customers with a reasonable cost of capital should be taking the discount — they're essentially borrowing at an extremely high implied rate if they don't.

Implement both utilities as a single JavaScript module (`early-payment.js`). Also write a demo script (`demo.js`) that shows the discount calculation for a few sample invoices and prints the annualized cost for all discount-bearing terms in the system. Run the demo and save the output.

## Output Specification

- `early-payment.js` — Module with `calculateEarlyPaymentDiscount(invoice, paymentDate)` and `computeImpliedCostOfCredit(termsCode)` functions, plus the PAYMENT_TERMS configuration object
- `demo.js` — Runnable Node.js script (no external dependencies) that exercises both functions and prints results to stdout
- `results.txt` — Output of running `node demo.js`, saved to file

The PAYMENT_TERMS configuration should cover at minimum the standard discount-bearing terms. The demo should include at least one case where the discount applies, one where it does not (payment too late), and compute the implied cost for at least two different discount terms.
