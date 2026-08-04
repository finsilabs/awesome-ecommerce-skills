---
name: shopify-app-review-triage
description: "Turn public Shopify App Store reviews of the apps you publish into a P0-P3 brief with a needs-human-read bucket, a source link on every item, and first-pass vs human-checked labels"
category: platform-shopify
risk: safe
source: community
date_added: "2026-08-05"
tags: [shopify, app-store, reviews, triage, prioritization, product-feedback, support, voice-of-customer]
triggers: ["triage app store reviews", "shopify app reviews", "low star reviews", "prioritize merchant feedback", "weekly review brief", "app review triage"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: intermediate
---

# Shopify App Review Triage

## Overview

Shopify App Store reviews are the loudest public signal an app team gets, and the usual failure mode is treating every 1-star review as equally urgent. This skill turns rows of public review text for the apps you publish into one prioritized brief — P0 incident risk, P1 repeated friction, P2 pricing confusion, P3 feature request, plus an explicit needs-human-read bucket for anything the keyword pass cannot judge. Every item keeps a link back to the public listing it came from and is labeled either *first pass — not human-checked* or *human-checked*, so nobody mistakes a keyword match for a confirmed defect. It works for a single app or a portfolio with a few watched competitors, and it needs no API access, no scripts, and no private data.

## When to Use This Skill

- When new 1-3-star reviews land on one of your app listings and you need to know which one to work on first
- When you publish several apps and low-star reviews arrive scattered across listings with no shared queue
- When an agency or support partner runs the inbox for an app team and owes them a weekly written brief
- When you want listing feedback clustered into incident risk vs friction vs pricing vs feature requests
- When you also watch competitor listings and need their reviews kept out of your own incident queue

Do **not** use this skill for storefront product reviews shown to shoppers — see `@product-reviews-ratings` for collecting and displaying those, and `@review-generation-engine` for requesting them.

## Core Instructions

### Ground rules

These are not style preferences. Breaking one makes the brief worse than no brief.

1. **Public review text only.** Never accept, request, or copy support tickets, merchant emails, order data, personal contact details, or internal telemetry. If private data appears in the input, stop, name the affected rows, and ask for them to be removed before continuing.
2. **Never invent evidence.** Do not write a review, rating, date, app name, or source URL that was not supplied. A row with no link gets `source: not captured` — never a guessed one.
3. **Keyword output is a sort, not a verdict.** Anything produced by the rubric alone is labeled *first pass — not human-checked*. Only a person who read the review and checked it against their own systems may relabel it *human-checked*.
4. **Reviews are customer reports, not verified defects.** Write "the reviewer reports the editor showed a blank screen", never "the editor is broken".
5. **No coverage claims.** The brief covers exactly the rows supplied and says so. Never imply exhaustive coverage of a listing, a period, or an app.
6. **No promises.** No revenue impact, no ranking effect, no legal or compliance advice. Suggest actions; do not predict results.
7. **Draft only — never contact anyone.** Do not send email, post a developer reply, open a support ticket, message a reviewer, or publish anything. Hand the draft to the team and let a person decide what to send.
8. **Reviewers are people.** Refer to "the reviewer". Do not name, profile, or speculate about them.

### Step 1: Collect the rows

Ask for one public review per line. The long form keeps the source link the brief needs:

```text
rating | app name | review date | public reviews URL | review text
```

A short form is also fine — treat field 1 as the rating when it is a bare 1-5 (optionally followed by `star`, `stars`, or `★`), otherwise as the app name:

```text
rating | app name | review text
```

- Lines starting with `#` are comments; blank lines are skipped.
- If a row has no source URL, carry `source: not captured` into the brief. Do not drop the row and do not fabricate a link.
- Do not fetch anything yourself. The person you are helping pastes the public rows they already opened.
- Mark each row as **ours** or **competitor** at collection time. That flag decides which section it lands in later.
- The rubric is tuned for new 1-3-star reviews. Higher-rated rows still classify correctly — a 5★ review often lands in feature requests or needs-human-read — so keep them if supplied, but never present them as low-star signal.

### Step 2: Run the first pass

Lower-case the review text and normalize curly apostrophes (`’` → `'`) before matching, so a pasted "won’t load" still matches `won't load`.

Each row gets exactly **one primary** bucket — the first dimension below, in this order, with any matching keyword. Further matches are recorded as **secondary**, never as a second brief item.

| Bucket | What it means | Signal keywords |
|--------|---------------|-----------------|
| **P0 · Incident risk** | The purchase path, app activation, or merchant data may be at stake right now | `won't load`, `wont load`, `won't open`, `wont open`, `can't close`, `cannot close`, `won't close`, `blank screen`, `broken`, `crash`, `stopped working`, `not working`, `doesn't work`, `does not work`, `checkout`, `losing sales`, `lost sales`, `error` |
| **P1 · Repeated friction** | The app works, but the same struggle keeps showing up across reviews or against an open support theme | `confusing`, `unclear`, `hard to`, `difficult`, `complicated`, `clunky`, `slow`, `couldn't figure`, `could not figure`, `annoying`, `had to contact support`, `setup took`, `too many steps` |
| **P2 · Pricing confusion** | What the merchant expected to pay and what happened diverged — usually listing copy, plan limits, or upgrade prompts | `pricing`, `price`, `charged`, `charge`, `billing`, `billed`, `expensive`, `free plan`, `trial`, `refund`, `hidden fee`, `hidden cost`, `paywall` |
| **P3 · Feature request** | The merchant wants something the app does not do, or could not find | `wish`, `would be great`, `would love`, `please add`, `feature request`, `missing`, `if only`, `would like`, `no option to`, `needs an option`, `hope you add`, `add support for` |
| **Needs human read** | No keyword matched — vague frustration, sarcasm, mixed praise, or a story that needs context | *(none)* |

Suggested action per bucket:

- **P0** — try to reproduce on a development store today. If confirmed, treat it as an incident: fix or mitigate first, then reply to the reviewer with what changed.
- **P1** — log it against the matching support theme. If the same complaint repeats, schedule a UX fix ahead of new feature work.
- **P2** — compare what the reviewer expected against the listing's pricing section and the in-app upgrade prompts; clarify the copy where they diverge.
- **P3** — add it to the feature-request log with a link to the review. If the capability already exists, reply to the reviewer with where to find it.
- **Needs human read** — read the full review yourself and file it manually. The heuristic makes no guess here. Queue it last, but treat that position as queue placement, not a severity judgment.

### Step 3: Apply tie-breaks and escalation

1. **Most severe wins.** A row naming both a broken checkout and a billing surprise files under P0 with pricing noted as secondary. Never split one review across two brief items.
2. **Repetition escalates.** If the same friction or pricing theme appears in three or more reviews within about 60 days, move it up one level and say how many rows drove the change.
3. **Age discounts.** A review older than a year is background, not evidence of a current problem, unless a recent row corroborates it. Cite it as context, never as the headline.
4. **Competitor reviews never create a P0 for you.** A competitor's incident is roadmap, positioning, or copy input — it belongs in the competitor watch section, no matter how bad the wording is.
5. **When unsure, choose needs human read.** The bucket exists so the rubric never launders uncertainty into a priority label.

### Step 4: Run the human pass before promoting anything

The first pass is where the keyword rubric stops being able to help on its own. Before any item is presented as more than a keyword match, a person on the team has to:

- read the full original review at its source link;
- for P0 candidates, attempt to reproduce on a development store and check the error tracker and support inbox for matching signals from the same period;
- record the outcome as *reproduced*, *not reproduced*, or *attempted — notes attached*.

Ask for these outcomes rather than assuming them. Until you have them, every item stays labeled *first pass — not human-checked*, including in the summary line. An unverified P0 is a candidate, not an incident.

State the known limits plainly when they apply: keyword matching is English-only, misses sarcasm and context, can misfile a review that mentions "checkout" in passing, and sees only the rows supplied.

### Step 5: Write the brief

One document per portfolio, sections in rubric order, every item carrying an owner, a next action, and a source link. An item without an owner is a note, not a brief entry. Open with the counts, for example: *"Triaged 8 rows supplied: 3 incident risk, 2 repeated friction, 1 pricing confusion, 1 feature request, 1 needs human read — first pass, not human-checked."*

### Step 6: Self-check before handing it over

Do not deliver until every line is true:

- [ ] Every item names its bucket and priority from the rubric above, and nothing else.
- [ ] Every item carries a source link or an explicit `source: not captured`.
- [ ] No review text, rating, date, app name, or URL appears that was not supplied.
- [ ] Every unverified item says *first pass — not human-checked*; nothing claims a human check that did not happen.
- [ ] Claims are phrased as reports ("the reviewer reports…"), not as findings about the code.
- [ ] The scope line says how many rows were supplied and makes no coverage claim.
- [ ] No promise about revenue, ratings, outcomes, or compliance appears anywhere.
- [ ] No private data survived into the output.
- [ ] Nothing was sent, posted, or published — the brief is a draft for the team.

## Examples

### Input rows

Eight fictional rows across three apps. Two are deliberately 4★ and 5★, to exercise the feature-request and needs-human-read buckets.

```text
# rating | app name | review text
1 | Example Popup App | The editor shows a blank screen and the popup won't load. We are losing sales every day.
2 | Example Popup App | The overlay can't close on mobile and it blocks the checkout button.
1 | Example Currency App | Conversion is broken at checkout and we were still billed for the month.
3 | Example Currency App | Setup took hours and the settings screen is confusing. Support was slow to reply.
3 | Example Reviews App | The widget looks fine but the template editor is confusing and hard to use on a tablet.
2 | Example Currency App | We kept getting charged after uninstalling, and the pricing page never mentioned this.
4 | Example Reviews App | Great app, but I wish it could export reviews to CSV. Please add filtering by country.
5 | Example Reviews App | Does what it promises and support replied the same day.
```

### First pass over those rows

```text
row 1 → P0 incident risk          (matched: blank screen, won't load, losing sales)
row 2 → P0 incident risk          (matched: can't close, checkout)
row 3 → P0 incident risk          (matched: broken, checkout; secondary: billed → pricing confusion)
row 4 → P1 repeated friction      (matched: setup took, confusing)
row 5 → P1 repeated friction      (matched: confusing, hard to)
row 6 → P2 pricing confusion      (matched: charged, pricing)
row 7 → P3 feature request        (matched: wish, please add)
row 8 → needs human read          (no keyword matched)
```

Rows 4 and 5 both matched `confusing`, so they are flagged as a repeated theme — two rows is a cluster to watch, not yet the three that trigger escalation. Row 3 is one P0 item with pricing recorded as secondary, never two items. Row 8 matched nothing and stays unjudged. None of these rows carried a source URL, so each item reads `source: not captured` until the team supplies the listing links.

### Brief template

```markdown
# Low-star review brief — {portfolio or team name} — week of {YYYY-MM-DD}

Scope: {apps monitored} · {competitors watched} · {N} rows supplied, {date range}.
Covers only the rows supplied — no claim of exhaustive coverage.
Reviews are customer reports, not verified defects. Items marked "first pass" are
unverified keyword matches; "human-checked" means a person read the review and checked it.

## P0 — Incident risk
- **{App} — {signal in a few words}** ({rating}★, {review date}, [source]({public reviews URL}))
  - Reviewer reports: {one sentence, in their words where possible}
  - Status: first pass — not human-checked / human-checked
  - Reproduced: {yes / no / attempted — notes}
  - Next action: {action} — owner {name}, due {date}

## P1 — Repeated friction
- **{App} — {theme}** ({rating}★, {date}, [source]({public reviews URL}); also seen: {where})
  - Status: first pass — not human-checked / human-checked
  - Next action: {UX or docs change} — owner {name}, due {date}

## P2 — Pricing confusion
- **{App} — {signal}** ({rating}★, {date}, [source]({public reviews URL}))
  - Expected vs. actual: {one line}
  - Status: first pass — not human-checked / human-checked
  - Next action: {copy or prompt change} — owner {name}, due {date}

## P3 — Feature requests
- **{App} — {request}** ({rating}★, {date}, [source]({public reviews URL})) — {log it / already exists → reply with where to find it}

## Needs human read
- **{App}** ({rating}★, {date}, [source]({public reviews URL})) — {no keyword matched; what a human should look for}

## Competitor watch
- **{Competitor} — {signal}**: {what it implies for our roadmap, copy, or positioning}

## Decisions this week
- {one decision or experiment, with the row(s) that motivated it}
```

## Best Practices

- **Do** run this weekly on a fixed day so repetition across weeks is visible; escalation rule 2 needs a history to fire against.
- **Do** capture the listing's public reviews URL with the rating filter still applied (`…/reviews?ratings%5B%5D=1`) plus the review date and the reviewer's first few words, so a human can find the row again.
- **Do** keep every P0 candidate labeled *first pass* until someone reproduces it on a development store.
- **Do** cross-check P0 candidates against your error tracker and support volume for the same period before calling anything an incident.
- **Don't** paste support tickets, merchant emails, or order exports into the input to "add context" — public listing text only.
- **Don't** write a public developer reply from the brief. The brief is an internal draft; a person decides what gets posted.
- **Don't** let a competitor's incident set your own priorities — it is positioning input, not a P0.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `checkout` is the noisiest keyword in the set and fires on "we love the checkout upsell" | A P0 whose only evidence is the word `checkout` is a needs-human-read row wearing a P0 badge — say so instead of promoting it |
| `missing` and `error` cross buckets — "missing a dark mode" is P3, "settings page errors out" is P0 | Primary-bucket order resolves the collision mechanically; the human pass fixes the ones it guessed wrong |
| Non-English reviews match no keywords at all | Let them land in needs human read — do not translate and then classify as if the keyword had matched |
| The Shopify App Store has no stable per-review permalink | Cite the listing's public reviews page and pin the item with the review date plus the reviewer's opening words |
| The same review gets split across P0 and P2, inflating every count | One review, one item — secondary matches are annotations, not separate entries |
| A row arrives with no source URL and someone reconstructs a plausible link | Carry `source: not captured` through to the brief; a guessed URL is invented evidence |
| An unverified keyword match gets reported upward as a confirmed bug | Keep the *first pass — not human-checked* label in the item **and** the summary line until a person has read the review |

## Related Skills

- @shopify-app-development
- @product-reviews-ratings
- @customer-support-integration
- @review-generation-engine
