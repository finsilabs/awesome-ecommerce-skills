---
name: first-party-data-collection
description: "Build a first-party data strategy with progressive profiling, zero-party surveys, preference centers, and quiz-based product recommendations"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [first-party-data, privacy, zero-party]
triggers: ["collect first-party data", "build preference center"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# First-Party Data Collection

## Overview

Third-party cookies are deprecated across all major browsers and iOS tracking restrictions have cut signal quality for paid channels by 30–60%. First-party data — information customers actively share with you — is now your most defensible marketing asset. Zero-party data (preferences, interests, and intent voluntarily declared by the customer) is even more valuable because it requires no inference. This skill covers the full stack: building a customer data schema, implementing progressive profiling, deploying preference centers, creating zero-party data collection touchpoints (quizzes, surveys, post-purchase forms), and linking collected data back to personalization and ESP audiences.

## When to Use This Skill

- When ROAS on Meta and Google is declining due to signal loss from tracking restrictions
- When building a new customer data platform (CDP) or structured customer profile
- When launching a preference center as part of an email list health initiative
- When you want to reduce survey/quiz data to product recommendation personalization
- When preparing for GDPR/CCPA compliance and need a structured consent management system
- When launching a loyalty or VIP program and need enriched customer profiles

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, analytics platform (GA4, Segment), consent management tool, email service for data collection flows

## Core Instructions

### 1. Customer data schema

Design a schema that covers both declared (zero-party) and observed (first-party) data:

```typescript
interface CustomerProfile {
  id: string;
  email: string;
  phone?: string;

  // Identity
  firstName?: string;
  lastName?: string;
  birthMonth?: number;   // not full DOB for GDPR minimization
  gender?: 'M' | 'F' | 'NB' | 'PREFER_NOT';

  // Declared preferences (zero-party)
  preferredCategories: string[];
  preferredBrands: string[];
  shoeSize?: string;
  clothingSize?: string;
  skinType?: string;         // vertical-specific
  shoppingFrequency?: 'weekly' | 'monthly' | 'occasionally';
  budgetRange?: 'under-50' | '50-100' | '100-200' | '200+';
  primaryUseCase?: string;   // "gifts", "self", "work", "sport"

  // Channel preferences (declared)
  emailFrequency?: 'daily' | 'weekly' | 'special-only';
  smsConsent: boolean;
  pushConsent: boolean;

  // Observed first-party signals
  lastViewedCategories: string[];    // from session analytics
  lastSearchTerms: string[];
  avgOrderValue: number;
  lifetimeValue: number;
  orderCount: number;

  // Consent & compliance
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  ccpaOptOut: boolean;
  consentVersion: string;            // version of your privacy policy at time of consent
  dataSource: string[];              // ['checkout', 'quiz', 'preference-center']

  // Profile completeness
  profileCompleteness: number;       // 0–100%, drives progressive profiling logic
  lastProfileUpdate: Date;
}
```

### 2. Progressive profiling — ask one question at a time

Never ask for 10 fields at signup. Show one incremental question each time the customer engages:

```typescript
const PROFILE_QUESTIONS: ProfileQuestion[] = [
  { field: 'firstName',           step: 1,  trigger: 'post-signup',       label: 'What should we call you?' },
  { field: 'birthMonth',          step: 2,  trigger: 'post-first-order',  label: 'When is your birthday? (Get a surprise gift!)' },
  { field: 'preferredCategories', step: 3,  trigger: 'second-visit',      label: 'What do you shop for most?' },
  { field: 'clothingSize',        step: 4,  trigger: 'pdp-apparel-visit', label: 'What is your size? We will filter recommendations.' },
  { field: 'emailFrequency',      step: 5,  trigger: 'third-email',       label: 'How often do you want to hear from us?' },
  { field: 'shoppingFrequency',   step: 6,  trigger: 'post-third-order',  label: 'How often do you shop online?' },
  { field: 'primaryUseCase',      step: 7,  trigger: 'quiz-campaign',     label: 'Are you shopping for yourself or as a gift?' },
];

function getNextProfileQuestion(profile: CustomerProfile): ProfileQuestion | null {
  const answered = new Set(Object.entries(profile)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k]) => k));

  return PROFILE_QUESTIONS.find(q => !answered.has(q.field)) ?? null;
}

function computeProfileCompleteness(profile: CustomerProfile): number {
  const fields = ['firstName', 'birthMonth', 'preferredCategories', 'clothingSize', 'emailFrequency', 'shoppingFrequency', 'primaryUseCase'];
  const completed = fields.filter(f => {
    const v = (profile as any)[f];
    return v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0);
  });
  return Math.round((completed.length / fields.length) * 100);
}
```

### 3. Product quiz for zero-party data

```tsx
interface QuizStep {
  id: string;
  question: string;
  options: { label: string; value: string; icon?: string }[];
  profileField: keyof CustomerProfile;
  multiSelect: boolean;
}

const PRODUCT_QUIZ: QuizStep[] = [
  {
    id: 'use-case',
    question: 'What brings you here today?',
    multiSelect: false,
    profileField: 'primaryUseCase',
    options: [
      { label: 'Shopping for myself', value: 'self', icon: '🛒' },
      { label: 'Looking for a gift',  value: 'gift', icon: '🎁' },
      { label: 'Work / professional', value: 'work', icon: '💼' },
    ],
  },
  {
    id: 'categories',
    question: 'Which categories interest you most?',
    multiSelect: true,
    profileField: 'preferredCategories',
    options: [
      { label: 'Skincare',   value: 'skincare' },
      { label: 'Apparel',    value: 'apparel' },
      { label: 'Home Decor', value: 'home-decor' },
      { label: 'Electronics', value: 'electronics' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your typical budget per order?',
    multiSelect: false,
    profileField: 'budgetRange',
    options: [
      { label: 'Under $50',  value: 'under-50' },
      { label: '$50 – $100', value: '50-100' },
      { label: '$100 – $200', value: '100-200' },
      { label: '$200+',      value: '200+' },
    ],
  },
];

function QuizComponent({ onComplete }: { onComplete: (answers: Partial<CustomerProfile>) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<CustomerProfile>>({});

  const currentStep = PRODUCT_QUIZ[step];

  const handleSelect = (value: string | string[]) => {
    const updated = { ...answers, [currentStep.profileField]: value };
    setAnswers(updated);
    if (step < PRODUCT_QUIZ.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(updated);
    }
  };

  return (
    <div className="quiz-container">
      <div className="progress-bar" style={{ width: `${((step + 1) / PRODUCT_QUIZ.length) * 100}%` }} />
      <h2>{currentStep.question}</h2>
      <div className="options">
        {currentStep.options.map(opt => (
          <button key={opt.value} onClick={() => handleSelect(opt.value)} className="option-btn">
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 4. Preference center

```tsx
function PreferenceCenter({ customerId }: { customerId: string }) {
  const { data: profile, mutate } = useSWR(`/api/profile/${customerId}`, fetcher);

  const handleSave = async (updates: Partial<CustomerProfile>) => {
    await fetch(`/api/profile/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    mutate();
    toast.success('Preferences saved!');
  };

  if (!profile) return <Spinner />;

  return (
    <form onSubmit={e => { e.preventDefault(); handleSave(Object.fromEntries(new FormData(e.target as HTMLFormElement))); }}>
      <section>
        <h3>Email Frequency</h3>
        {['daily', 'weekly', 'special-only'].map(freq => (
          <label key={freq}>
            <input type="radio" name="emailFrequency" value={freq} defaultChecked={profile.emailFrequency === freq} />
            {freq === 'daily' ? 'Daily deals' : freq === 'weekly' ? 'Weekly digest' : 'Special occasions only'}
          </label>
        ))}
      </section>

      <section>
        <h3>Favorite Categories</h3>
        {CATEGORIES.map(cat => (
          <label key={cat.value}>
            <input type="checkbox" name="preferredCategories" value={cat.value} defaultChecked={profile.preferredCategories.includes(cat.value)} />
            {cat.label}
          </label>
        ))}
      </section>

      <section>
        <h3>Communication Channels</h3>
        <label>
          <input type="checkbox" name="smsConsent" defaultChecked={profile.smsConsent}
            onChange={e => handleSave({ smsConsent: e.target.checked })} />
          Text message deals and alerts
        </label>
      </section>

      <button type="submit">Save Preferences</button>
      <button type="button" onClick={() => handleSave({ emailFrequency: 'special-only', smsConsent: false })}>
        Reduce all communications
      </button>
    </form>
  );
}
```

### 5. Post-purchase survey

```typescript
// Trigger 2 days after delivery confirmation
async function sendPostPurchaseSurvey(orderId: string) {
  const order = await db.orders.findByPk(orderId, { include: ['customer'] });
  if (!order || !order.customer.email) return;

  const surveyToken = await createSurveyToken(orderId, order.customer.id);

  await emailClient.send({
    to: order.customer.email,
    subject: `How did we do? Quick question about your order`,
    template: 'post-purchase-survey',
    data: {
      firstName: order.customer.firstName,
      surveyUrl: `${process.env.STORE_URL}/survey?token=${surveyToken}`,
      orderId,
    },
  });
}

// POST /api/survey/submit
async function handleSurveySubmit(token: string, answers: SurveyAnswers) {
  const survey = await db.surveyTokens.findOne({ where: { token, usedAt: null } });
  if (!survey) throw new Error('Invalid or expired survey token');

  await db.customerProfiles.update({
    primaryUseCase:     answers.primaryUseCase,
    satisfactionScore:  answers.npsScore,
    lastProfileUpdate:  new Date(),
  }, { where: { customerId: survey.customerId } });

  await survey.update({ usedAt: new Date(), answers });
  await db.npsResponses.create({ customerId: survey.customerId, score: answers.npsScore, comment: answers.comment });
}
```

### 6. Consent management

```typescript
async function recordConsent(customerId: string, params: {
  type: 'marketing-email' | 'marketing-sms' | 'data-processing';
  granted: boolean;
  method: 'checkbox' | 'preference-center' | 'double-opt-in';
  ipAddress: string;
  userAgent: string;
  policyVersion: string;
}) {
  await db.consentLogs.create({
    customerId,
    ...params,
    consentedAt: params.granted ? new Date() : null,
    revokedAt: !params.granted ? new Date() : null,
  });

  if (params.type === 'marketing-email') {
    await db.customerProfiles.update({ gdprConsent: params.granted }, { where: { customerId } });
  }
  if (params.type === 'marketing-sms') {
    await db.customerProfiles.update({ smsConsent: params.granted }, { where: { customerId } });
  }
}

// GDPR right to erasure
async function handleErasureRequest(customerId: string) {
  await db.customerProfiles.update({
    firstName: null, lastName: null, phone: null, birthMonth: null,
    preferredCategories: [], preferredBrands: [], gdprConsent: false,
    erasedAt: new Date(),
  }, { where: { customerId } });

  // Notify ESP to delete profile
  await klaviyoClient.deleteProfile(customerId);
}
```

## Best Practices

- **Data minimization**: only collect fields you actively use for personalization or compliance; every extra field is a liability
- **Value exchange**: always explain what the customer gets from sharing data ("so we can send you fewer, more relevant emails")
- **Progressive over comprehensive**: a 40% complete profile from 60% of customers beats a 100% complete profile from 10%
- **Store consent version**: link each consent record to the exact privacy policy version in effect at the time — critical for GDPR audits
- **Separate marketing consent from transactional**: transactional emails (order confirmation, shipping) need no marketing consent; only segment/promotion emails require it
- **Quiz completion drives value immediately**: route quiz completions directly to a curated results page with product recommendations — do not just collect the data without immediate reward
- **Audit log immutability**: consent logs should be append-only; never update or delete them — only add new entries
- **Profile completeness gamification**: show a profile completeness bar in account settings with specific benefits at each level (50% → priority support, 80% → early access)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Quiz abandonment above 60% | Reduce to 3 questions maximum; show progress bar; make it skippable |
| Profile data gets stale | Ask customers to re-confirm preferences annually; trigger with anniversary email |
| Consent records not capturing IP | Use server-side consent capture, not just client-side — intercept at API layer |
| CCPA opt-out not propagating to ad platforms | Build a CCPA signal that suppresses customer from Google Customer Match and Meta Custom Audiences |
| Preference center causes more unsubscribes | Offering "reduce frequency" option prevents full unsubscribes; add it prominently |
| Zero-party data not used in recommendations | Build explicit pipeline: quiz answer → profile field → recommendation filter → ESP property |
| Data collected but never acted on | Audit quarterly: for each profile field, identify which campaign or personalization uses it |

## Testing and Validation

### Integration checklist

- [ ] Progressive profiling shows next unanswered question on correct trigger
- [ ] Quiz answers persist to customer profile within 5 seconds of completion
- [ ] Preference center pre-fills current preferences correctly
- [ ] Consent log records IP address, timestamp, policy version, and method for every change
- [ ] GDPR erasure request removes PII within 30 days (document the SLA)
- [ ] Profile completeness score updates after each new field populated
- [ ] ESP segments refresh within 1 hour of profile update

### KPIs

- **Profile completeness rate**: average completeness across all active customers (target: 60%+)
- **Quiz completion rate**: completions / starts (target: 65%+)
- **Preference center engagement**: unique visits / email sent (indicates customers actively managing preferences)
- **Data-driven recommendation CTR**: customers with filled preference fields vs. empty fields
- **Consent rate at checkout**: percentage of new customers granting marketing consent (target: 40–60%)

## Related Skills

- @email-list-segmentation
- @predictive-personalization
- @lifecycle-marketing-automation
- @email-marketing-automation
- @customer-retention-engine
