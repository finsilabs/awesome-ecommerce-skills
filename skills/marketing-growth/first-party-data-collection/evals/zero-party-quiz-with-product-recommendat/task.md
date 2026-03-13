# Product Recommendation Quiz for a Home Goods Brand

## Problem/Feature Description

Hearth & Co. is a home goods and lifestyle brand that sells everything from kitchen accessories to bedroom furnishings. Their marketing director has noticed that new visitors who land on the homepage bounce at a rate of 72% because they face an undifferentiated product catalog of 800+ items with no clear starting point. Existing product filters help repeat customers who know what they want, but do nothing for first-time visitors.

The team wants to build a short onboarding quiz that helps new visitors find the right products while simultaneously collecting declared preference data that can be stored on the customer profile and fed into their email platform. The quiz will be embedded in the homepage hero for new visitors. Past attempts at long onboarding flows (7+ questions) had very poor completion rates, so the new quiz must be short and feel immediate — users should see relevant product suggestions as soon as they finish.

The quiz must connect to the rest of the data platform: answers should flow through to a named customer profile field, which is then used as a filter when pulling product recommendations, and finally synced as a property on the ESP audience so that targeted email campaigns can be built from the data.

## Output Specification

Produce the following files:

- `quiz-component.tsx` — a React component implementing the quiz UI
- `quiz-pipeline.ts` — a module that maps quiz answers to profile fields, applies them as recommendation filters, and syncs them to an ESP contact property
- `quiz-design.md` — a short document describing the quiz UX decisions, including how many questions are included and why, what happens at the end of the quiz, and how users can opt out of completing it

The quiz-design.md should include:
- The number of questions and rationale
- A description of what the user sees after completing the quiz
- How the quiz handles users who do not want to complete it
- A diagram or written description of the data flow from quiz answer to ESP property
