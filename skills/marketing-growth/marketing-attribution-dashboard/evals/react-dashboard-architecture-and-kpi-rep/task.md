# Marketing Attribution Dashboard UI

## Problem/Feature Description

A growth analytics team at an ecommerce company has finished building the backend attribution engine and now needs a React front-end dashboard that their marketing managers can use daily. The existing dashboard only shows last-click data pulled directly from Google Analytics. Managers are frustrated because the numbers don't reconcile with actual orders, and they have no way to see how changing the attribution model affects channel rankings.

The new dashboard needs to present aggregated marketing performance data fetched from an internal API endpoint (`/api/attribution/metrics`). It should allow users to switch between attribution models and time periods on the fly, display key performance indicators prominently, visualize the most common multi-channel customer journeys, and let stakeholders see a side-by-side comparison of how different attribution models credit the same orders. Critically, the data team has warned that the sum of per-channel attributed revenue will often exceed the actual total order revenue when using multi-touch models — the UI must make this clear rather than confusing users. The team also needs the dashboard to auto-refresh without requiring a page reload, since the underlying data updates throughout the day.

## Output Specification

Build the React dashboard as a TypeScript/TSX component. Write the implementation to `AttributionDashboard.tsx`.

The component should include:
1. Controls to select the attribution model and the time period.
2. Summary KPI cards section.
3. A channel performance table.
4. A section visualizing common customer journey paths.
5. A section for comparing attribution models.

Also write a `dashboard-spec.md` file that describes:
- The data fetching strategy used (library, refresh behavior)
- How the dashboard handles the discrepancy between per-channel attributed revenue and actual total revenue
- The default attribution model and default time period and the rationale for each choice
- How each attribution model is explained to non-technical users in the UI (include the actual copy/text for at least 3 model explainers)
- How channel metrics are segmented (what breakdown dimensions are used)
- The journey path query limit and why it was chosen
