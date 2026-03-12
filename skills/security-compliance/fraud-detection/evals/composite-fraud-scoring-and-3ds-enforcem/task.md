# Payment Risk Scoring Engine

## Problem/Feature Description

A subscription box company has grown rapidly into international markets and is now seeing a significant uptick in fraudulent orders originating from VPN-masked IPs, newly registered email addresses, and cards that have never been used on the platform before. The fraud team has assembled a list of signals they want combined into a single numeric risk score that can drive automated decisions — without requiring manual review of every single transaction.

They need a TypeScript module that accepts multiple fraud signals as inputs and produces both a numeric risk score and a clear approve/review/block decision. The module must also integrate with Stripe PaymentIntents so that high-risk orders require stronger authentication from the card issuer, while low-risk transactions stay as frictionless as possible.

The company's fraud analyst has specifically requested that the Stripe Radar machine-learning score be the dominant input, but that local signals supplement it with meaningful weight. They also want the decision logic to be clean and auditable.

## Output Specification

Produce a single TypeScript file named `fraud-score.ts` that exports:
- A `calculateRiskScore(signals: FraudSignals): number` function
- A `getFraudDecision(score: number): 'approve' | 'review' | 'block'` function
- A `createPaymentIntentWithFraudCheck(order: Order, customer: Customer): Promise<Stripe.PaymentIntent>` function (types can be stubbed/simplified)

Include a `FraudSignals` interface in the file.

Also write a `test-cases.md` file with at least 3 worked examples showing input signals → expected score → expected decision, calculated by hand, to demonstrate that the scoring logic is correct.

Do not install or run anything; source code and the worked examples are the deliverables.
