---
name: merchandising-rules
description: "Control which products appear first in collections using automated ranking rules, manual overrides, and performance-based sorting algorithms"
category: business-operations
risk: safe
source: curated
date_added: "2026-03-12"
tags: [merchandising, product-ranking, collections, sorting, curation, search-relevance, boosting]
triggers: ["implement merchandising rules", "build product ranking", "automate collection curation", "product sorting algorithm"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Merchandising Rules

## Overview

Build a merchandising rules engine for e-commerce that controls product ranking on collection pages, automated collection membership, search result boosting, and visual merchandising (pinning, burying, and slot-based placement). This skill covers the data model for merchandising rules, scoring algorithms that blend business metrics with manual overrides, automated collection rules (smart collections), and A/B testing hooks for measuring the revenue impact of different ranking strategies.

## When to Use This Skill

- When building product ranking logic for collection and category pages
- When creating automated (smart) collections based on product attributes, tags, or performance
- When implementing search result boosting and burying for merchandising control
- When adding pinning (manual placement) and slot-based merchandising to collection pages
- When measuring the revenue impact of different product ranking strategies

## Core Instructions

1. **Define the merchandising rule data model**

   ```typescript
   interface MerchandisingRule {
     id: string;
     name: string;
     type: 'ranking' | 'collection' | 'search_boost' | 'pinning';
     scope: {
       target: 'collection' | 'search' | 'global';
       collectionId?: string;
       searchQuery?: string;
     };
     conditions: RuleCondition[];
     actions: RuleAction[];
     priority: number;           // Higher = applied first
     schedule?: {
       startsAt: Date;
       endsAt?: Date;
     };
     isActive: boolean;
     createdAt: Date;
     updatedAt: Date;
   }

   interface RuleCondition {
     field: string;               // 'tag', 'vendor', 'product_type', 'price', 'inventory', 'created_at'
     operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
     value: string | number | string[];
   }

   interface RuleAction {
     type: 'boost' | 'bury' | 'pin' | 'exclude' | 'include';
     value?: number;              // Boost/bury weight (-100 to 100)
     position?: number;           // Pin to specific slot (1-based)
   }

   interface CollectionRule {
     id: string;
     collectionId: string;
     title: string;
     conditions: RuleCondition[];
     conditionLogic: 'all' | 'any';  // AND vs OR
     sortOrder: SortOrder;
     manualOverrides: ManualOverride[];
     isAutomatic: boolean;
     refreshInterval: number;     // Minutes
   }

   type SortOrder =
     | { type: 'best_selling' }
     | { type: 'newest' }
     | { type: 'price_asc' }
     | { type: 'price_desc' }
     | { type: 'manual' }
     | { type: 'score'; weights: ScoreWeights };

   interface ScoreWeights {
     salesVelocity: number;       // 0-1, weight for recent sales
     revenue: number;             // 0-1, weight for total revenue
     conversionRate: number;      // 0-1, weight for conversion rate
     margin: number;              // 0-1, weight for profit margin
     recency: number;             // 0-1, weight for product newness
     inventory: number;           // 0-1, weight for stock levels
   }

   interface ManualOverride {
     productId: string;
     action: 'pin' | 'bury' | 'exclude';
     position?: number;
   }
   ```

2. **Build the product scoring engine**

   ```typescript
   class ProductScoringEngine {
     constructor(
       private metricsRepo: ProductMetricsRepository,
       private defaultWeights: ScoreWeights = {
         salesVelocity: 0.30,
         revenue: 0.20,
         conversionRate: 0.20,
         margin: 0.15,
         recency: 0.10,
         inventory: 0.05,
       }
     ) {}

     async scoreProducts(
       productIds: string[],
       weights?: ScoreWeights
     ): Promise<Map<string, number>> {
       const w = weights || this.defaultWeights;
       const metrics = await this.metricsRepo.getMetrics(productIds);
       const scores = new Map<string, number>();

       // Normalize each metric to 0-1 range across the product set
       const normalized = this.normalizeMetrics(metrics);

       for (const product of normalized) {
         const score =
           product.salesVelocity * w.salesVelocity +
           product.revenue * w.revenue +
           product.conversionRate * w.conversionRate +
           product.margin * w.margin +
           product.recency * w.recency +
           product.inventoryScore * w.inventory;

         scores.set(product.productId, Math.round(score * 1000) / 1000);
       }

       return scores;
     }

     private normalizeMetrics(metrics: ProductMetrics[]): NormalizedMetrics[] {
       if (metrics.length === 0) return [];

       // Find min/max for each metric
       const ranges = {
         salesVelocity: this.getRange(metrics.map(m => m.unitsSold30d)),
         revenue: this.getRange(metrics.map(m => m.revenue30d)),
         conversionRate: this.getRange(metrics.map(m => m.conversionRate)),
         margin: this.getRange(metrics.map(m => m.grossMarginPct)),
         recency: this.getRange(metrics.map(m => m.daysSinceCreated)),
         inventory: this.getRange(metrics.map(m => m.inventoryQuantity)),
       };

       return metrics.map(m => ({
         productId: m.productId,
         salesVelocity: this.normalize(m.unitsSold30d, ranges.salesVelocity),
         revenue: this.normalize(m.revenue30d, ranges.revenue),
         conversionRate: this.normalize(m.conversionRate, ranges.conversionRate),
         margin: this.normalize(m.grossMarginPct, ranges.margin),
         // Invert recency: newer products = higher score
         recency: 1 - this.normalize(m.daysSinceCreated, ranges.recency),
         // Moderate inventory: not too high (overstock), not too low
         inventoryScore: m.inventoryQuantity > 0
           ? Math.min(this.normalize(m.inventoryQuantity, ranges.inventory), 0.8)
           : 0,
       }));
     }

     private normalize(value: number, range: { min: number; max: number }): number {
       if (range.max === range.min) return 0.5;
       return (value - range.min) / (range.max - range.min);
     }

     private getRange(values: number[]): { min: number; max: number } {
       return { min: Math.min(...values), max: Math.max(...values) };
     }
   }
   ```

3. **Implement collection product ranking with manual overrides**

   ```typescript
   class CollectionMerchandiser {
     constructor(
       private scoringEngine: ProductScoringEngine,
       private productRepo: ProductRepository,
       private rulesRepo: MerchandisingRulesRepository
     ) {}

     async getCollectionProducts(
       collectionId: string,
       page: number = 1,
       limit: number = 24
     ): Promise<{ products: RankedProduct[]; total: number }> {
       const rule = await this.rulesRepo.getCollectionRule(collectionId);
       if (!rule) {
         // Fallback to default sorting
         return this.productRepo.getByCollection(collectionId, { page, limit });
       }

       // 1. Get all products in the collection (or matching automatic rules)
       let productIds: string[];
       if (rule.isAutomatic) {
         productIds = await this.evaluateAutomaticCollection(rule);
       } else {
         productIds = await this.productRepo.getProductIdsByCollection(collectionId);
       }

       // 2. Score products
       const scores = rule.sortOrder.type === 'score'
         ? await this.scoringEngine.scoreProducts(productIds, rule.sortOrder.weights)
         : await this.getSimpleSortScores(productIds, rule.sortOrder);

       // 3. Apply merchandising rule boosts/buries
       const activeRules = await this.rulesRepo.getActiveRules(collectionId);
       for (const merchRule of activeRules) {
         this.applyBoostBury(scores, productIds, merchRule);
       }

       // 4. Apply manual overrides (pinning and exclusions)
       const ranked = this.applyManualOverrides(
         productIds,
         scores,
         rule.manualOverrides
       );

       // 5. Paginate
       const total = ranked.length;
       const offset = (page - 1) * limit;
       const pageProducts = ranked.slice(offset, offset + limit);

       // 6. Fetch full product data for the page
       const products = await this.productRepo.getByIds(
         pageProducts.map(p => p.productId)
       );

       return {
         products: pageProducts.map(rp => ({
           ...products.find(p => p.id === rp.productId)!,
           score: rp.score,
           isPinned: rp.isPinned,
         })),
         total,
       };
     }

     private applyBoostBury(
       scores: Map<string, number>,
       productIds: string[],
       rule: MerchandisingRule
     ): void {
       for (const action of rule.actions) {
         const matchingProducts = this.filterByConditions(productIds, rule.conditions);

         for (const productId of matchingProducts) {
           const currentScore = scores.get(productId) || 0;

           if (action.type === 'boost') {
             scores.set(productId, currentScore + (action.value || 50) / 100);
           } else if (action.type === 'bury') {
             scores.set(productId, currentScore - (action.value || 50) / 100);
           } else if (action.type === 'exclude') {
             scores.delete(productId);
           }
         }
       }
     }

     private applyManualOverrides(
       productIds: string[],
       scores: Map<string, number>,
       overrides: ManualOverride[]
     ): RankedProduct[] {
       // Remove excluded products
       const excludedIds = new Set(
         overrides.filter(o => o.action === 'exclude').map(o => o.productId)
       );

       // Sort by score (descending)
       const sorted = productIds
         .filter(id => !excludedIds.has(id) && scores.has(id))
         .sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0))
         .map(id => ({
           productId: id,
           score: scores.get(id) || 0,
           isPinned: false,
         }));

       // Insert pinned products at their positions
       const pinned = overrides
         .filter(o => o.action === 'pin' && o.position)
         .sort((a, b) => (a.position || 0) - (b.position || 0));

       for (const pin of pinned) {
         // Remove from current position if present
         const existingIdx = sorted.findIndex(p => p.productId === pin.productId);
         if (existingIdx !== -1) sorted.splice(existingIdx, 1);

         // Insert at pinned position (1-based)
         const insertIdx = Math.min((pin.position || 1) - 1, sorted.length);
         sorted.splice(insertIdx, 0, {
           productId: pin.productId,
           score: 999,
           isPinned: true,
         });
       }

       return sorted;
     }
   }
   ```

4. **Build automated (smart) collection evaluation**

   ```typescript
   async evaluateAutomaticCollection(rule: CollectionRule): Promise<string[]> {
     // Build database query from rule conditions
     let query = this.productRepo.createQueryBuilder('p')
       .where('p.status = :status', { status: 'active' });

     for (const condition of rule.conditions) {
       const clause = this.buildConditionClause(condition);
       if (rule.conditionLogic === 'all') {
         query = query.andWhere(clause.sql, clause.params);
       } else {
         query = query.orWhere(clause.sql, clause.params);
       }
     }

     const products = await query.select('p.id').getMany();
     return products.map(p => p.id);
   }

   private buildConditionClause(condition: RuleCondition): { sql: string; params: Record<string, any> } {
     const paramKey = `cond_${condition.field}`;

     switch (condition.operator) {
       case 'equals':
         return {
           sql: `p.${condition.field} = :${paramKey}`,
           params: { [paramKey]: condition.value },
         };
       case 'contains':
         return {
           sql: `p.${condition.field} ILIKE :${paramKey}`,
           params: { [paramKey]: `%${condition.value}%` },
         };
       case 'greater_than':
         return {
           sql: `p.${condition.field} > :${paramKey}`,
           params: { [paramKey]: condition.value },
         };
       case 'less_than':
         return {
           sql: `p.${condition.field} < :${paramKey}`,
           params: { [paramKey]: condition.value },
         };
       case 'in':
         return {
           sql: `p.${condition.field} = ANY(:${paramKey})`,
           params: { [paramKey]: condition.value },
         };
       default:
         return { sql: '1=1', params: {} };
     }
   }
   ```

5. **Implement search result boosting**

   ```typescript
   class SearchMerchandiser {
     constructor(
       private searchEngine: SearchEngine,  // Elasticsearch, Algolia, Meilisearch
       private rulesRepo: MerchandisingRulesRepository
     ) {}

     async search(
       query: string,
       filters: Record<string, string[]>,
       page: number = 1,
       limit: number = 24
     ): Promise<SearchResult> {
       // Get active search boost rules
       const boostRules = await this.rulesRepo.getSearchBoostRules(query);

       // Build the search request with merchandising boosts
       const searchRequest: SearchRequest = {
         query,
         filters,
         page,
         limit,
         boosts: [],
       };

       for (const rule of boostRules) {
         for (const action of rule.actions) {
           if (action.type === 'boost') {
             searchRequest.boosts.push({
               conditions: rule.conditions,
               weight: action.value || 50,
             });
           }
         }
       }

       // Example: Elasticsearch function_score query
       const esQuery = this.buildElasticsearchQuery(searchRequest);
       return this.searchEngine.search(esQuery);
     }

     private buildElasticsearchQuery(request: SearchRequest): object {
       const functions: object[] = [];

       // Add merchandising boosts
       for (const boost of request.boosts) {
         for (const condition of boost.conditions) {
           functions.push({
             filter: this.conditionToEsFilter(condition),
             weight: 1 + (boost.weight / 100),  // Convert percentage to weight multiplier
           });
         }

       // Default: boost products that are in stock
       functions.push({
         filter: { range: { inventory_quantity: { gt: 0 } } },
         weight: 1.5,
       });

       // Slight boost for products with images
       functions.push({
         filter: { exists: { field: 'featured_image' } },
         weight: 1.1,
       });

       return {
         function_score: {
           query: {
             multi_match: {
               query: request.query,
               fields: ['title^3', 'description', 'tags^2', 'vendor'],
               type: 'best_fields',
               fuzziness: 'AUTO',
             },
           },
           functions,
           score_mode: 'multiply',
           boost_mode: 'multiply',
         },
       };
     }

     private conditionToEsFilter(condition: RuleCondition): object {
       switch (condition.operator) {
         case 'equals':
           return { term: { [condition.field]: condition.value } };
         case 'contains':
           return { match: { [condition.field]: condition.value } };
         case 'greater_than':
           return { range: { [condition.field]: { gt: condition.value } } };
         case 'in':
           return { terms: { [condition.field]: condition.value } };
         default:
           return { match_all: {} };
       }
     }
   }
   ```

6. **Add a merchandising admin API**

   ```typescript
   // POST /api/admin/merchandising/rules
   async function createRule(req: AuthRequest, res: Response) {
     const input = merchandisingRuleSchema.parse(req.body);

     const rule = await rulesRepo.create({
       ...input,
       createdBy: req.adminUser.id,
     });

     // If it's a collection rule, regenerate the collection immediately
     if (rule.type === 'collection' && rule.scope.collectionId) {
       await collectionMerchandiser.regenerate(rule.scope.collectionId);
     }

     await auditLog.log({
       userId: req.adminUser.id,
       action: 'merchandising_rule_created',
       resource: `rule:${rule.id}`,
       details: { ruleName: rule.name, ruleType: rule.type },
     });

     res.status(201).json({ rule });
   }

   // POST /api/admin/merchandising/collections/:id/pin
   async function pinProduct(req: AuthRequest, res: Response) {
     const { collectionId } = req.params;
     const { productId, position } = req.body;

     await rulesRepo.addManualOverride(collectionId, {
       productId,
       action: 'pin',
       position,
     });

     // Regenerate the collection
     await collectionMerchandiser.regenerate(collectionId);

     res.json({ message: `Product pinned to position ${position}` });
   }

   // POST /api/admin/merchandising/collections/:id/preview
   async function previewCollection(req: AuthRequest, res: Response) {
     const { collectionId } = req.params;
     const { weights } = req.body;  // Override weights for preview

     const result = await collectionMerchandiser.getCollectionProducts(
       collectionId, 1, 48, weights
     );

     res.json({
       products: result.products.map(p => ({
         id: p.id,
         title: p.title,
         price: p.price,
         image: p.featuredImage,
         score: p.score,
         isPinned: p.isPinned,
       })),
       total: result.total,
     });
   }
   ```

## Examples

### Time-based merchandising rules for seasonal campaigns

```typescript
// Automatically boost winter products in November-January
const winterBoostRule: MerchandisingRule = {
  id: 'winter-boost-2026',
  name: 'Winter Collection Boost',
  type: 'ranking',
  scope: { target: 'global' },
  conditions: [
    { field: 'tag', operator: 'in', value: ['winter', 'cold-weather', 'holiday'] },
  ],
  actions: [
    { type: 'boost', value: 40 },  // +40% score boost
  ],
  priority: 10,
  schedule: {
    startsAt: new Date('2026-11-01'),
    endsAt: new Date('2027-01-31'),
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Bury out-of-season clearance items (don't exclude — they should still be findable)
const clearanceBuryRule: MerchandisingRule = {
  id: 'clearance-bury',
  name: 'Bury Clearance Items',
  type: 'ranking',
  scope: { target: 'global' },
  conditions: [
    { field: 'tag', operator: 'contains', value: 'clearance' },
  ],
  actions: [
    { type: 'bury', value: 60 },  // -60% score penalty
  ],
  priority: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Product metrics collection job

```typescript
// Run daily to aggregate product performance metrics for the scoring engine
async function collectProductMetrics(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const metrics = await db.query(`
    SELECT
      p.id AS product_id,
      COALESCE(SUM(oi.quantity), 0) AS units_sold_30d,
      COALESCE(SUM(oi.net_revenue), 0) AS revenue_30d,
      CASE
        WHEN SUM(oi.net_revenue) > 0
        THEN ((SUM(oi.net_revenue) - COALESCE(SUM(oi.quantity * p_cost.cost_price), 0))
              / SUM(oi.net_revenue) * 100)
        ELSE 0
      END AS gross_margin_pct,
      COALESCE(views.view_count, 0) AS page_views_30d,
      CASE
        WHEN COALESCE(views.view_count, 0) > 0
        THEN (COUNT(DISTINCT oi.order_id)::numeric / views.view_count * 100)
        ELSE 0
      END AS conversion_rate,
      EXTRACT(DAY FROM NOW() - p.created_at) AS days_since_created,
      SUM(v.inventory_quantity) AS inventory_quantity
    FROM products p
    LEFT JOIN order_line_items oi
      ON oi.product_id = p.id AND oi.created_at >= $1
    LEFT JOIN product_variants v ON v.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS view_count
      FROM page_views
      WHERE viewed_at >= $1
      GROUP BY product_id
    ) views ON views.product_id = p.id
    LEFT JOIN product_variants p_cost ON p_cost.product_id = p.id
    WHERE p.status = 'active'
    GROUP BY p.id, views.view_count, p.created_at
  `, [thirtyDaysAgo]);

  // Write metrics to the product_metrics table
  for (const row of metrics.rows) {
    await metricsRepo.upsert(row);
  }

  console.log(`Updated metrics for ${metrics.rows.length} products`);
}
```

## Best Practices

- **Blend algorithmic scoring with manual control** -- automated scoring handles the long tail of products; manual pinning and boosting let merchandisers promote hero products and new arrivals
- **Use weighted scoring, not hard rules** -- instead of "always show new products first," assign weights so newness contributes to the score alongside sales velocity and margin
- **Refresh scores on a schedule, not on every request** -- pre-compute product scores daily or hourly and store them; serving pre-computed scores is fast, scoring in real-time is slow
- **Provide a preview mode** -- let merchandisers see how a rule change will affect the collection before publishing; this prevents costly mistakes
- **Log every merchandising change** -- maintain an audit trail of who changed which rule and when; this helps debug unexpected ranking changes
- **A/B test ranking strategies** -- measure whether a different weight configuration improves revenue per visitor; don't rely on intuition alone
- **Bury out-of-stock products, don't exclude them** -- out-of-stock products should still be findable (for SEO and wishlists) but ranked lower; exclude only discontinued products
- **Cap the boost/bury range** -- use a bounded scale (-100 to +100) to prevent a single rule from completely overriding the scoring algorithm

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Best-selling products always dominate the top positions | Add diversity constraints: limit max 3 products per vendor in top 10; boost recency weight to surface new products |
| Pinned products shift position when pagination changes | Use absolute positions (slot 1, slot 5) and resolve conflicts (two products pinned to same slot) by priority or creation order |
| Smart collection query is too slow for large catalogs | Pre-compute collection membership and store in a junction table; refresh on a schedule rather than evaluating rules on every page load |
| Score normalization breaks with outlier products | Use percentile-based normalization instead of min-max; cap outliers at the 95th percentile to prevent one viral product from compressing all other scores |
| Merchandising rules conflict with each other | Apply rules in priority order and define clear precedence: manual pins beat boost rules beat algorithmic scoring |
| New products get zero score (no sales data yet) | Apply a "newness boost" for products created in the last 14 days that decays linearly; this gives new products visibility while they build sales history |

## Related Skills

- @product-data-modeling
- @ecommerce-seo
- @ecommerce-data-warehouse
- @discount-engine
- @product-page-design
