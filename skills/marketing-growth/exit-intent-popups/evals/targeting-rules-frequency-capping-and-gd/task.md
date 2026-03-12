# Email Capture Popup with Targeting and Compliance

## Problem/Feature Description

A European fashion retailer is launching a new online store and wants to capture email addresses from visitors who are about to leave the site. Their legal team has flagged that several competitors have been fined for non-compliant email marketing signup flows. The team wants a React popup component and the surrounding display logic that is both effective and legally sound for EU markets.

The popup should only show to visitors who are worth targeting — the team has noticed that showing it to everyone, including customers mid-checkout and already-logged-in users, has caused significant annoyance. They also discovered that frequent re-display of the popup to return visitors is hurting their brand perception. The solution needs to suppress display for visitors who've already seen it recently, handle the case where a visitor explicitly closes the popup differently from simply navigating away, and respect visitors who are subscribed already.

## Output Specification

Produce the following TypeScript/React files:
- `popup-display.ts`: the logic to determine whether to show the popup and manage frequency state in browser storage
- `ExitIntentPopup.tsx`: the React component for the popup UI

Include a brief `integration-notes.md` describing the targeting rules implemented and the compliance considerations addressed.
