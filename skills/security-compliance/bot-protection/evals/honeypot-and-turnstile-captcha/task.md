# Bot-Resistant Checkout Form

## Problem/Feature Description

A consumer electronics retailer has been struggling with bots sweeping through their checkout flow. Their current checkout form has no bot protection at all — bots fill it in milliseconds, create phantom orders, and exhaust stock before human customers can complete a purchase. The security team wants to add a CAPTCHA layer and a simple passive trap to catch unsophisticated bots that blindly fill every form field.

The challenge is to add this protection without degrading the experience for legitimate shoppers: a traditional CAPTCHA puzzle on every checkout attempt would increase abandonment rates significantly. The team wants friction to be invisible for real humans, only escalating to a visible challenge when there are genuine signals of automated behavior. They also want a complementary mechanism that catches the simplest bots at zero cost, but one that isn't trivially defeated by bots that skip commonly-named decoy fields.

## Output Specification

Produce the following files implementing the checkout form protection:

- `components/CheckoutForm.tsx` — React component with both the passive bot-detection trap and the CAPTCHA widget embedded in the form
- `lib/bot-check.ts` — server-side utility that validates the CAPTCHA token submitted with the form, returning the appropriate HTTP error when validation fails
- `IMPLEMENTATION_NOTES.md` — short explanation of each protection mechanism, how they complement each other, and any caveats about configuration (e.g. what environment variables are needed)

The implementation should work with a Next.js App Router project. You do not need to implement the full checkout logic — focus on the bot protection layer.
