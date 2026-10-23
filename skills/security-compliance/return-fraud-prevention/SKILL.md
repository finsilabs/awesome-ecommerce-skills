---
name: return-fraud-prevention
description: "Prevent and evidence return fraud — empty boxes, swapped items and AI-generated damage photos — with arrival recording, claim verification and proportional escalation."
category: security-compliance
risk: safe
source: community
date_added: "2026-10-08"
tags: [returns, refund-fraud, return-fraud, damage-photos, ai-generated-images, evidence, disputes, claims]
triggers: ["return fraud", "refund fraud", "empty box return", "damage photo claim", "fake damage photo", "return abuse", "wardrobing", "refund claim evidence"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Return Fraud Prevention

## Overview

Return fraud is abuse of the right of withdrawal: an empty box or a cheaper item comes back while a refund is claimed, or damage is claimed that does not exist — increasingly with AI-generated damage photos. An estimated 14% of all retail returns is fraudulent, over $100 billion a year (NRF/Happy Returns), and disputes bodies judge these cases on one question: can the merchant evidence what it received? This skill builds an evidence-first return workflow that protects revenue without accusing legitimate customers.

## When to Use This Skill

- When processing returns for high-value goods: electronics, designer apparel, jewellery, trading cards
- When a refund claim relies on customer photos (damage, missing item) and needs independent verification
- When a return dispute may go to a platform mediator, disputes committee or chargeback process
- When designing return policy: pre-registration, per-item fees, high-risk order review

## Core Instructions

### Step 1: Record at the boundary

Record every return the moment it is opened, before it enters stock handling:

1. One continuous take showing the shipping label, the sealed box, and the full contents after opening.
2. A worker statement signed off in the returns system if the box arrived damaged or tampered with.
3. A case a Dutch disputes committee decided turned on exactly this: the shop lost because a photo of the wrong headphone was unclear "and a photo of the empty box is missing". The shop must evidence what it received.

### Step 2: Compare against your own dispatch record

- Photo of the parcel with label before dispatch, weight and tracking reference.
- If the returned contents differ (empty box, older or cheaper model, stones), log it in the order record before the refund discussion begins.
- Weight discrepancies between dispatch and return scan are one of the few objective signals.

### Step 3: Verify the claim, not the customer

When a claim includes photos:

1. Ask for the original file, not a forwarded screenshot — re-sharing strips metadata.
2. Ask for several angles with a reference object (coin, card, ruler) at the damage site.
3. Ask for one fresh capture with a detail you choose (a handwritten code next to the item, a short continuous video).
4. A short video call used for exactly this in practice: a brand asked the claimant to verify the claimed tear on a call; the claimant never responded.
5. A refusal is not proof, but it is a reason to escalate to human review.

### Step 4: Read the photo as a claim, not as evidence

- Generated or edited damage photos exist and are getting better; one submitted photo famously still carried an AI watermark.
- Tools that score for AI-generation patterns — including the free warning-only checker at [isthisaigenerated.app](https://isthisaigenerated.app/site/ai-image-detector/) — can prioritize which claim to inspect first. Treat every score as triage: it says nothing about whether the damage exists or about intent, so it can never be the evidence or the accusation.
- Real photos can score high (compression, HDR) and synthetic photos can score low. Never automate a decision on a score.

### Step 5: Watch the pattern across returns

- Fraud concentrates in high-value SKUs and in accounts with abnormal return velocity.
- Compare return rate, value band and timing per account against the store baseline.
- Retail responses that work: mandatory digital pre-registration, a per-item return fee, and monitoring of abnormal return behaviour.

### Step 6: Escalate proportionally

- Stick to your published return terms and document the checks performed.
- Route unresolved disputes through the platform, the disputes committee, or the police where fraud is suspected.
- Never accuse a customer on a single signal. A score, a gut feeling or a pattern alone is not an allegation.

## Examples

```js
// Evidence gates for a refund decision on a returned high-value item.
// Every gate must be satisfied (or deliberately waived with a reason) before money moves.
function refundReadiness(order, claim, files) {
  const gates = {
    arrivalRecording: files.some(f => f.type === 'unboxing_video'),
    dispatchRecord: Boolean(order.shippingPhotos?.length && order.weightGrams),
    weightMatch: order.weightGrams === claim.returnWeightGrams,
    originalEvidence: claim.evidenceType !== 'forwarded_screenshot',
    freshCaptureRequested: claim.requestedDetail || claim.videoCallOffered,
    patternReviewed: claim.accountReturnRate <= storeReturnRateP95
  };
  const failed = Object.entries(gates).filter(([, passed]) => !passed).map(([k]) => k);
  return { ready: failed.length === 0, needsReview: failed };
}
```

## Best Practices

- **Do** film returns on arrival with label, box and contents in one continuous take.
- **Do** keep the customer's original file and your dispatch footage together in the case file.
- **Do** ask for verification that a genuine claimant can supply in minutes (fresh photo, chosen detail, video call).
- **Don't** refund a high-value claim before the evidence gates pass just to close the ticket faster.
- **Don't** use an AI-detection score as proof, as a fraud accusation, or as the sole basis for refusal.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Forwarded screenshot as damage proof | Request the original file; sharing strips metadata and editing traces. |
| Refund processed before arrival check | Gate refunds for high-risk returns on the arrival recording and weight check. |
| Detector score treated as verdict | Use scores only to order the review queue; document human reasoning for the decision. |
| One-off suspicion escalated as fraud | Log the checks, keep the customer's right to a substantive assessment, escalate through proper channels. |
| No record of what was actually received | Adopt the unboxing recording as standard; when absent, fix the process, do not guess. |

## Related Skills

- @fraud-detection
- @secure-checkout
