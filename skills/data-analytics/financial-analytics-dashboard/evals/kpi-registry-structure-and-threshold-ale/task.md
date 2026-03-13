# E-Commerce KPI Alert System

## Problem/Feature Description

A fast-growing direct-to-consumer brand has outgrown its weekly finance review meetings. The CFO wants a proactive alerting system that monitors key financial KPIs in real time and notifies the team when something unexpected happens — before it shows up in the weekly report. The business tracks several metrics across revenue, profitability, and unit economics, each of which behaves differently and has its own acceptable range based on historical norms.

The team has been burned before by alert systems that either fire constantly (generating noise everyone ignores) or never fire until a crisis is already visible. The new system needs to correctly classify severity — distinguishing situations that require immediate leadership escalation from those that just need monitoring — and it should produce structured alert records that can be stored and reviewed for post-mortems. The thresholds themselves need to be maintainable over time as the business scales, since a $75 customer acquisition cost target today may be very different from next year's target.

## Output Specification

Produce a Python module (e.g. `kpi_alerts.py`) containing:

1. A KPI registry data structure with at least 4 KPIs from the e-commerce domain (e.g. gross revenue, gross margin %, customer acquisition cost, return rate). Each KPI definition should include the metadata needed to display and monitor it.
2. An alert data structure (dataclass or equivalent) representing a single fired alert, with all fields needed to understand what happened and what to do.
3. A function that takes a dict of `{kpi_name: current_value}` and returns a list of alerts for any KPIs breaching their thresholds, sorted appropriately.
4. A brief `design_notes.md` explaining your threshold calibration approach — how you set threshold values relative to normal metric volatility to avoid alert fatigue.

The module should be runnable (or have a `if __name__ == '__main__'` demo block) that exercises the alerting logic with some example values. The output does not need a real database connection — use hardcoded or generated sample data for the demo.
