# Performance Regression Gate: Baseline Comparison Tooling

## Problem/Feature Description

Vanta Commerce has been running load tests before major releases for six months but has no automated way to know if a new deployment made performance worse. The team currently eyeballs charts and often misses subtle regressions — for example, a checkout p99 that crept up by 30% over three releases while the average stayed flat. They want to introduce a performance regression gate: a script that compares a new k6 test run against a stored baseline and fails the build if performance has degraded beyond an acceptable threshold.

The team also wants to extend their existing k6 search performance script to properly track per-endpoint search latency as a named custom metric (separate from the global http_req_duration), so the regression gate can be more precise. Currently all metrics are lumped together, making it impossible to pinpoint which endpoint regressed.

## Output Specification

Produce the following files:

1. `scripts/compare-results.ts` — A TypeScript script that reads two k6 JSON result files and compares their performance metrics. It should output a comparison table and exit with a non-zero status code when performance has degraded significantly.

2. `k6/search-performance.js` — A k6 script for search endpoint performance testing that uses a named custom metric to track search latency separately from overall request duration. Include appropriate thresholds.

3. `analysis-notes.md` — Document which metrics the comparison script evaluates, what threshold triggers a failure, and justify your choice of which statistical measure to use for regression detection.

## Input Files

The following k6 JSON result files are provided. Extract them before beginning.

=============== FILE: results/baseline-20260301.json ===============
{
  "metrics": {
    "http_req_duration": {
      "values": {
        "p(95)": 820,
        "p(99)": 1450,
        "avg": 310
      }
    },
    "http_req_failed": {
      "values": {
        "rate": 0.002
      }
    },
    "http_reqs": {
      "values": {
        "rate": 145.3
      }
    },
    "vus_max": {
      "values": {
        "max": 200
      }
    }
  }
}

=============== FILE: results/baseline-20260312.json ===============
{
  "metrics": {
    "http_req_duration": {
      "values": {
        "p(95)": 1100,
        "p(99)": 2200,
        "avg": 335
      }
    },
    "http_req_failed": {
      "values": {
        "rate": 0.008
      }
    },
    "http_reqs": {
      "values": {
        "rate": 139.1
      }
    },
    "vus_max": {
      "values": {
        "max": 200
      }
    }
  }
}
