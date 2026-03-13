---
name: marketing-attribution-dashboard
description: "Build multi-touch attribution dashboards tracking revenue by channel, campaign, and creative with blended ROAS analysis and budget allocation recommendations"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [attribution, analytics, marketing-roi]
triggers: ["build attribution dashboard", "track marketing ROI"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Marketing Attribution Dashboard

## Overview

Every ecommerce business faces attribution chaos: Meta says it drove 300 purchases, Google says 280, and your order management system shows 400 total. The overlap is real, the methodologies differ, and single-touch last-click models misrepresent the true value of upper-funnel channels. A proper multi-touch attribution dashboard aggregates touchpoints across all channels, applies a consistent attribution model, computes true ROI per channel, and gives you a unified view of the customer journey that self-reported platform data cannot provide. This skill builds the event collection pipeline, attribution model engine, and a React dashboard with drill-down reporting.

## When to Use This Skill

- When ad spend decisions rely on platform-reported ROAS rather than actual order data
- When you suspect paid social is stealing attribution from organic search or email
- When preparing a quarterly marketing budget review and need a defensible data source
- When launching a new channel and need to measure its true incremental contribution
- When customer LTV analysis reveals that certain channels bring lower-value customers
- When reporting marketing performance to investors or a board

## Core Instructions

### 1. Touchpoint event collection

Track every marketing touchpoint in a unified event table. Collect on the server side to avoid adblocker impact:

```typescript
interface TouchpointEvent {
  id: string;
  sessionId: string;
  customerId?: string;
  anonymousId: string;   // persistent cross-session cookie
  channel: string;       // 'paid-social' | 'paid-search' | 'organic' | 'email' | 'sms' | 'direct' | 'referral'
  source: string;        // 'meta' | 'google' | 'tiktok' | 'klaviyo' | 'google-organic'
  medium: string;        // utm_medium value
  campaign?: string;     // utm_campaign
  content?: string;      // utm_content (ad variation)
  term?: string;         // utm_term (keyword)
  landingPage: string;
  referrerUrl?: string;
  eventType: 'session_start' | 'add_to_cart' | 'initiate_checkout' | 'purchase';
  orderId?: string;
  orderValue?: number;
  timestamp: Date;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  isNewVisitor: boolean;
}

// Middleware: fire on every page request
async function trackTouchpoint(req: Request, res: Response, next: NextFunction) {
  const utm = extractUtmParams(req.query);
  const anonymousId = req.cookies['_aid'] ?? generateAnonymousId(res);

  // Only create touchpoint if there is a UTM source (paid/email) or it is a new session
  if (utm.source || !req.cookies['_session_tracked']) {
    const channel = classifyChannel(utm, req.headers.referer);

    await db.touchpoints.create({
      id: nanoid(),
      sessionId: req.sessionID,
      customerId: req.user?.id,
      anonymousId,
      channel,
      source: utm.source ?? inferSource(req.headers.referer),
      medium: utm.medium ?? 'organic',
      campaign: utm.campaign,
      content: utm.content,
      term: utm.term,
      landingPage: req.path,
      referrerUrl: req.headers.referer,
      eventType: 'session_start',
      timestamp: new Date(),
      deviceType: detectDevice(req.headers['user-agent']),
      isNewVisitor: !req.cookies['_returning'],
    });

    res.cookie('_session_tracked', '1', { maxAge: 1800 }); // 30-min session
  }

  next();
}

function classifyChannel(utm: UtmParams, referrer?: string): string {
  if (utm.medium === 'cpc' || utm.medium === 'paid')       return 'paid-search';
  if (utm.medium === 'paid-social' || utm.source?.match(/meta|facebook|instagram|tiktok/i)) return 'paid-social';
  if (utm.medium === 'email')                               return 'email';
  if (utm.medium === 'sms')                                 return 'sms';
  if (utm.medium === 'affiliate')                           return 'affiliate';
  if (referrer?.match(/google|bing|yahoo/i))                return 'organic-search';
  if (referrer && !referrer.includes(process.env.STORE_DOMAIN!)) return 'referral';
  if (!referrer || referrer.includes(process.env.STORE_DOMAIN!))  return 'direct';
  return 'other';
}
```

### 2. Attribution model engine

Support multiple models and let the dashboard switch between them:

```typescript
type AttributionModel = 'last-touch' | 'first-touch' | 'linear' | 'time-decay' | 'position-based';

interface AttributedConversion {
  orderId: string;
  orderValue: number;
  touchpoints: TouchpointEvent[];
  credits: Array<{
    touchpointId: string;
    channel: string;
    source: string;
    campaign?: string;
    creditAmount: number;
    creditFraction: number;
  }>;
}

function attributeConversion(
  order: Order,
  touchpoints: TouchpointEvent[],
  model: AttributionModel
): AttributedConversion {
  if (touchpoints.length === 0) {
    return { orderId: order.id, orderValue: order.total, touchpoints: [], credits: [] };
  }

  const weights = computeWeights(touchpoints, model);
  const credits = touchpoints.map((tp, i) => ({
    touchpointId: tp.id,
    channel: tp.channel,
    source: tp.source,
    campaign: tp.campaign,
    creditFraction: weights[i],
    creditAmount: order.total * weights[i],
  }));

  return { orderId: order.id, orderValue: order.total, touchpoints, credits };
}

function computeWeights(touchpoints: TouchpointEvent[], model: AttributionModel): number[] {
  const n = touchpoints.length;

  switch (model) {
    case 'last-touch':
      return touchpoints.map((_, i) => i === n - 1 ? 1 : 0);

    case 'first-touch':
      return touchpoints.map((_, i) => i === 0 ? 1 : 0);

    case 'linear':
      return touchpoints.map(() => 1 / n);

    case 'time-decay': {
      // More recent touchpoints get higher weight; half-life = 7 days
      const purchaseTime = touchpoints[n - 1].timestamp.getTime();
      const halfLifeMs = 7 * 24 * 60 * 60 * 1000;
      const rawWeights = touchpoints.map(tp => {
        const ageMs = purchaseTime - tp.timestamp.getTime();
        return Math.pow(0.5, ageMs / halfLifeMs);
      });
      const sum = rawWeights.reduce((a, b) => a + b, 0);
      return rawWeights.map(w => w / sum);
    }

    case 'position-based': {
      // 40% first, 40% last, 20% split across middle
      if (n === 1) return [1];
      if (n === 2) return [0.5, 0.5];
      const middleShare = 0.2 / (n - 2);
      return touchpoints.map((_, i) => {
        if (i === 0) return 0.4;
        if (i === n - 1) return 0.4;
        return middleShare;
      });
    }

    default:
      return touchpoints.map(() => 1 / n);
  }
}
```

### 3. Channel ROI aggregation

```typescript
interface ChannelMetrics {
  channel: string;
  source: string;
  impressions?: number;    // from ad platform APIs
  clicks?: number;
  spend: number;
  attributedRevenue: number;
  attributedOrders: number;
  roas: number;            // attributedRevenue / spend
  cac: number;             // spend / new customers
  newCustomerRevenue: number;
  returningCustomerRevenue: number;
  avgOrderValue: number;
  touchpointCount: number;
}

async function computeChannelMetrics(
  period: { start: Date; end: Date },
  model: AttributionModel
): Promise<ChannelMetrics[]> {
  // Fetch all orders in period
  const orders = await db.orders.findAll({
    where: { status: 'completed', createdAt: { gte: period.start, lte: period.end } },
  });

  // Build attribution for each order
  const allCredits: AttributedConversion['credits'][number][] = [];

  for (const order of orders) {
    const touchpoints = await getOrderTouchpoints(order);
    const attribution  = attributeConversion(order, touchpoints, model);
    allCredits.push(...attribution.credits);
  }

  // Aggregate by channel + source
  const grouped = groupBy(allCredits, c => `${c.channel}::${c.source}`);

  // Fetch ad spend from platform APIs
  const adSpend = await fetchAdSpend(period);

  return Object.entries(grouped).map(([key, credits]) => {
    const [channel, source] = key.split('::');
    const revenue = credits.reduce((s, c) => s + c.creditAmount, 0);
    const orders  = new Set(credits.map(c => c.touchpointId)).size; // proxy
    const spend   = adSpend[source] ?? 0;

    return {
      channel, source,
      spend,
      attributedRevenue: revenue,
      attributedOrders: orders,
      roas: spend > 0 ? revenue / spend : 0,
      cac: spend > 0 ? spend / orders : 0,
      avgOrderValue: orders > 0 ? revenue / orders : 0,
      touchpointCount: credits.length,
      newCustomerRevenue: credits.filter(c => c.isNewCustomer).reduce((s, c) => s + c.creditAmount, 0),
      returningCustomerRevenue: credits.filter(c => !c.isNewCustomer).reduce((s, c) => s + c.creditAmount, 0),
    };
  });
}
```

### 4. Ad spend ingestion from platform APIs

```typescript
async function fetchAdSpend(period: { start: Date; end: Date }): Promise<Record<string, number>> {
  const [metaSpend, googleSpend, tiktokSpend] = await Promise.all([
    fetchMetaSpend(period),
    fetchGoogleSpend(period),
    fetchTikTokSpend(period),
  ]);

  return { meta: metaSpend, google: googleSpend, tiktok: tiktokSpend };
}

async function fetchMetaSpend(period: { start: Date; end: Date }): Promise<number> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${process.env.META_AD_ACCOUNT_ID}/insights?` +
    new URLSearchParams({
      fields: 'spend',
      time_range: JSON.stringify({ since: formatDate(period.start), until: formatDate(period.end) }),
      access_token: process.env.META_ACCESS_TOKEN!,
    })
  );
  const data = await response.json();
  return parseFloat(data.data?.[0]?.spend ?? '0');
}

async function fetchGoogleSpend(period: { start: Date; end: Date }): Promise<number> {
  // Using Google Ads API v17
  const customer = googleAdsClient.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  });

  const [response] = await customer.report({
    entity: 'campaign',
    attributes: ['campaign.id'],
    metrics: ['metrics.cost_micros'],
    constraints: {
      'segments.date': { GTE: formatDate(period.start), LTE: formatDate(period.end) },
    },
  });

  return response.reduce((sum: number, row: any) => sum + row.metrics.cost_micros / 1e6, 0);
}
```

### 5. React dashboard

```tsx
function AttributionDashboard() {
  const [model, setModel] = useState<AttributionModel>('position-based');
  const [period, setPeriod] = useState<'7d' | '30d' | 'custom'>('30d');

  const { data: metrics } = useSWR(
    `/api/attribution/metrics?model=${model}&period=${period}`,
    fetcher,
    { refreshInterval: 3600000 } // refresh hourly
  );

  return (
    <div className="attribution-dashboard">
      <header>
        <h1>Marketing Attribution</h1>
        <div className="controls">
          <ModelSelector value={model} onChange={setModel} />
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </header>

      <section className="summary-cards">
        <KpiCard label="Total Attributed Revenue" value={formatCurrency(metrics?.totalRevenue)} />
        <KpiCard label="Total Ad Spend" value={formatCurrency(metrics?.totalSpend)} />
        <KpiCard label="Blended ROAS" value={metrics?.blendedRoas.toFixed(2) + 'x'} />
        <KpiCard label="New Customer CAC" value={formatCurrency(metrics?.avgCac)} />
      </section>

      <section className="channel-table">
        <h2>Channel Performance</h2>
        <ChannelTable channels={metrics?.channels ?? []} sortKey="attributedRevenue" />
      </section>

      <section className="journey-sankey">
        <h2>Common Customer Journeys</h2>
        <SankeyChart data={metrics?.journeyPaths ?? []} />
      </section>

      <section className="model-comparison">
        <h2>Attribution Model Comparison</h2>
        <ModelComparisonChart orderId={metrics?.sampleOrderId} />
      </section>
    </div>
  );
}
```

### 6. Customer journey path analysis

```typescript
async function getTopJourneyPaths(limit = 20): Promise<JourneyPath[]> {
  const conversions = await db.orders.findAll({
    where: { status: 'completed' },
    include: ['touchpoints'],
    limit: 5000,
    order: [['createdAt', 'DESC']],
  });

  const pathCounts: Record<string, { count: number; revenue: number }> = {};

  for (const order of conversions) {
    const path = order.touchpoints
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map((tp: any) => tp.channel)
      .join(' → ');

    pathCounts[path] = pathCounts[path] ?? { count: 0, revenue: 0 };
    pathCounts[path].count += 1;
    pathCounts[path].revenue += order.total;
  }

  return Object.entries(pathCounts)
    .map(([path, { count, revenue }]) => ({ path, count, revenue, avgOrderValue: revenue / count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
```

## Best Practices

- **Use position-based as your default model**: it correctly rewards both discovery (first-touch) and closing (last-touch) channels, which is more defensible than linear for budget decisions
- **Never trust a single platform's self-reported numbers**: every ad platform over-attributes to itself; your order database is ground truth
- **Minimum lookback window of 30 days**: customers frequently research for weeks before buying; 7-day windows miss upper-funnel contributions
- **Stitch anonymous sessions to customer IDs post-login**: link pre-login touchpoints to the customer record after checkout identifies them
- **Benchmark against incrementality tests**: at least quarterly, run a holdout test (geo or audience split) to validate your attribution model against true incrementality
- **Segment new vs. returning customer attribution**: returning customer revenue should be weighted differently from new customer acquisition cost
- **Log all model assumptions**: document your channel classification rules and cookie window so anyone can reproduce the numbers

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Direct traffic massively over-attributed | Set a 30-min session timeout; re-attribute direct sessions that immediately followed an ad click |
| Email channel under-attributed | Ensure email UTM parameters survive redirects; test all ESP link tracking |
| Total attributed revenue > actual revenue | With multi-touch, individual channel sums will exceed total — this is expected; show both |
| Cookie deletion breaks journey stitching | Use server-side session stitching via email or login events as fallback |
| Ad spend import fails silently | Add alerting when spend ingestion returns zero for a channel that spent yesterday |
| Dashboard loads slowly | Precompute aggregated metrics nightly into a summary table; query summary, not raw events |
| Model comparison confuses stakeholders | Include a "what this means" explainer for each model in the UI |

## Testing and Validation

### Integration checklist

- [ ] UTM parameters captured correctly for all ad channels (verify in raw touchpoints table)
- [ ] Anonymous ID persists across sessions via 1-year cookie
- [ ] Customer ID stitched to anonymous ID after purchase
- [ ] Attribution model produces weights that sum to 1.0 for every order
- [ ] Ad spend import runs nightly and shows non-zero for all active channels
- [ ] Dashboard API responds in under 3 seconds for 30-day period

### KPIs this dashboard should expose

- ROAS per channel (attributed revenue / spend)
- CAC by channel and new vs. returning
- Average touchpoints per conversion path
- Most common multi-channel journey sequences
- Revenue by attribution model (last-touch vs. position-based variance)

## Related Skills

- @meta-ads-integration
- @google-ads-ecommerce
- @tiktok-ads-integration
- @affiliate-program
- @influencer-marketplace-integration
