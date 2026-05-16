# Functionality Measurement Skill

Use this for every code change that adds or changes product functionality.

## Rule

Every implemented functionality needs a measurable customer-impact signal. Treat measurement as part of done, not as a later analytics cleanup.

## Required For Each Change

1. Define the user-facing outcome before implementation.
2. Choose at least one metric that can compare before and after behavior.
3. Record the metric through `apps/frontend/utils/metrics.ts`, backend telemetry, tests, or a documented verification command.
4. Add or update tests when metric behavior is code-owned.
5. Report the result in the final summary as a comparison when possible, such as `load time decreased from 420ms to 260ms`, `fallback recovery coverage increased from 0 to 3 states`, or `validated transaction paths increased from 2 to 5`.

## Metric Types

- Performance: latency, render time, API duration, time to usable screen.
- Reliability: fallback coverage, retry success, validation failure handling, crash/error reduction.
- Product utility: completed workflow count, searchable/filterable states, supported categories, manual steps removed.
- Data trust: source visibility, freshness coverage, malformed payload rejection, stale state detection.
- Test confidence: tested paths, contract cases, regression scenarios, high-risk files covered.

## If A Numeric Baseline Does Not Exist

Create one of these:

- A focused test count, branch count, or scenario count.
- A timing measurement from `timeAsync()` or `timeSync()`.
- A documented manual verification baseline.
- A clear `before: not measured` to `after: measured by <event/test/command>` statement.

Do not invent numbers. If the exact before/after value is not available, state what instrumentation now exists and what future runs can compare.

## Resume-Friendly Output

End implementation summaries with a short measurement line:

```text
Measurement: transaction fallback coverage increased from cache-only persistence to 3 verified paths: cloud load, cloud save, cache fallback.
```

This keeps portfolio and resume claims concrete: improved from X to Y, reduced from Xms to Yms, or added measurable coverage where none existed.
